/**
 * Email notifications go through a queue (Notification entries) instead of being sent right
 * away: a message can be edited or deleted, a mention removed, or an announcement cancelled
 * during the delay. The cron task checks every entry again just before sending it.
 *
 * - mention / reply / review: grouped into one digest email per learner and run
 * - announcement: one email per learner
 * - reminder: one email per learner, created by scheduleReminders()
 */

import { canReadChannel, canUseSpace, isEnrolled } from "./access";
import { courseCompletion, findSpaceWithFallback, removeDrafts } from "./content";
import { escapeHtml, getSite, renderEmail, sendEmail, t, textToHtml } from "./email";

declare const strapi: any;

const NOTIFICATION = "api::notification.notification";

/**
 * Notification emails are off unless NOTIFICATIONS_ENABLED=true: nothing is queued, sent or
 * scheduled, and the site hides the announcements tab and the profile setting.
 */
export const notificationsEnabled = () => process.env.NOTIFICATIONS_ENABLED === "true";
const MAX_PER_RUN = 300;

/** Minutes a notification waits in the queue (NOTIFICATION_DELAY_MINUTES, default 15). */
export const delayMinutes = () => {
  const value = parseInt(process.env.NOTIFICATION_DELAY_MINUTES || "", 10);
  return Number.isFinite(value) && value >= 0 ? value : 15;
};

const sendAfter = (minutes = delayMinutes()) => new Date(Date.now() + minutes * 60_000);

/** User ids mentioned in a forum message: the editor stores mentions as @[Full Name](id). */
export const mentionedUserIds = (text: string) => {
  const ids = new Set<number>();
  for (const match of String(text || "").matchAll(/@\[[^\]]*\]\((\d+)\)/g)) {
    ids.add(parseInt(match[1], 10));
  }
  return [...ids];
};

const plainExcerpt = (text: string, max = 300) => {
  const plain = String(text || "")
    .replace(/@\[([^\]]*)\]\(\d+\)/g, "@$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
};

const fullName = (user: any) =>
  [user?.name, user?.lastname].filter(Boolean).join(" ") || user?.username || "";

const exists = async (filters: any) =>
  (await strapi.entityService.findMany(NOTIFICATION, { filters, fields: ["id"], limit: 1 }))
    .length > 0;

/**
 * Queues mention and reply notifications for a new or edited forum message. Recipients already
 * notified about this message are skipped, so editing a message only notifies new mentions.
 */
export const queueMessageNotifications = async (messageId: number) => {
  if (!notificationsEnabled()) return;
  const message = await strapi.entityService.findOne("api::message.message", messageId, {
    populate: {
      users_permissions_user: { fields: ["id"] },
      parent: { populate: { users_permissions_user: { fields: ["id"] } } },
      channel: { populate: { forum: { populate: { learning_space: { fields: ["uid"] } } } } },
    },
  });
  if (!message) return;
  const authorId = message.users_permissions_user?.id;
  const spaceUid = message.channel?.forum?.learning_space?.uid || null;

  const queue = async (type: string, userId: number) => {
    if (!userId || userId === authorId) return;
    if (await exists({ message: { id: message.id }, user: { id: userId } })) return;
    await strapi.entityService.create(NOTIFICATION, {
      data: { type, user: userId, message: message.id, spaceUid, status: "pending", sendAfter: sendAfter() },
    });
  };

  for (const userId of mentionedUserIds(message.text)) await queue("mention", userId);
  const parentAuthor = message.parent?.users_permissions_user?.id;
  if (parentAuthor) await queue("reply", parentAuthor);
};

/** Queues the "your submission was reviewed" email (once per submission while pending). */
export const queueReviewNotification = async (submission: any, spaceUid: string) => {
  if (!notificationsEnabled()) return;
  const userId = submission.users_permissions_user?.id;
  if (!userId) return;
  if (await exists({ submission: { id: submission.id }, status: "pending" })) return;
  await strapi.entityService.create(NOTIFICATION, {
    data: { type: "review", user: userId, submission: submission.id, spaceUid, status: "pending", sendAfter: sendAfter() },
  });
};

/** Queues an announcement for every learner enrolled in the course. Returns how many. */
export const queueAnnouncement = async (announcement: any, spaceUid: string) => {
  const enrollments = await strapi.entityService.findMany("api::enrollment.enrollment", {
    filters: { learning_space: { uid: spaceUid } },
    populate: { users_permissions_user: { fields: ["id", "blocked"] } },
    limit: -1,
  });
  const userIds = [
    ...new Set<number>(
      enrollments
        .map((e: any) => e.users_permissions_user)
        .filter((u: any) => u && !u.blocked)
        .map((u: any) => u.id)
    ),
  ];
  const when = sendAfter();
  for (const userId of userIds) {
    await strapi.entityService.create(NOTIFICATION, {
      data: { type: "announcement", user: userId, announcement: announcement.id, spaceUid, status: "pending", sendAfter: when },
    });
  }
  return userIds.length;
};

// ---------------------------------------------------------------------------------------------
// Sending

const setStatus = (id: number, status: string, error?: string) =>
  strapi.entityService.update(NOTIFICATION, id, {
    data: { status, sentAt: status === "sent" ? new Date() : null, error: error || null },
  });

/** Course names per uid and language, for the emails. */
const courseNames = new Map<string, string>();
const courseName = async (spaceUid: string, locale: string) => {
  const key = `${spaceUid}|${locale}`;
  if (!courseNames.has(key)) {
    const space = await findSpaceWithFallback(spaceUid, locale, { fields: ["name"] });
    courseNames.set(key, space?.name || "");
  }
  return courseNames.get(key);
};

/** Channel name in the learner's language (channels share a uid across languages). */
const channelName = async (channel: any, locale: string) => {
  if (!channel?.uid) return channel?.name || "";
  const localized = await strapi.entityService.findMany("api::channel.channel", {
    filters: { uid: channel.uid },
    fields: ["name"],
    locale,
  });
  return localized[0]?.name || channel.name || "";
};

/**
 * Why a queued notification must not be sent any more (null = send it).
 * The checks run at send time, so edits and deletions during the delay are taken into account.
 */
const cancelReason = async (n: any) => {
  const user = n.user;
  if (!user) return "user deleted";
  if (user.blocked) return "user blocked";
  const optedOut = user.emailNotifications === false;

  switch (n.type) {
    case "mention":
    case "reply": {
      if (optedOut) return "email notifications off";
      const message = n.message;
      if (!message) return "message deleted";
      if (n.type === "mention" && !mentionedUserIds(message.text).includes(user.id))
        return "mention removed";
      if (n.type === "reply" && message.parent?.users_permissions_user?.id !== user.id)
        return "not a reply to this user any more";
      if (!(await canReadChannel(user, message.channel?.uid))) return "no access to the channel";
      return null;
    }
    case "review": {
      const submission = n.submission;
      if (!submission) return "submission deleted";
      if (!submission.reviewedAt || (!submission.feedback && !submission.grade)) return "review removed";
      return null;
    }
    case "announcement": {
      if (!n.announcement) return "announcement deleted";
      if (!(await canUseSpace(user, n.spaceUid))) return "not enrolled any more";
      return null;
    }
    case "reminder": {
      if (optedOut) return "email notifications off";
      if (!(await isEnrolled(user.id, n.spaceUid))) return "not enrolled any more";
      return null;
    }
    default:
      return "unknown type";
  }
};

/** One <li> of the digest email. */
const digestItem = async (n: any, locale: string, frontendUrl: string) => {
  const course = escapeHtml(await courseName(n.spaceUid, locale));
  if (n.type === "review") {
    const s = n.submission;
    const url = `${frontendUrl}/space/${n.spaceUid}${s.moduleId ? `/module/${s.moduleId}` : ""}`;
    const grade = s.grade ? `<br>${t(locale, "grade")}: <strong>${escapeHtml(s.grade)}</strong>` : "";
    const feedback = s.feedback ? `<br><em>${escapeHtml(plainExcerpt(s.feedback, 600))}</em>` : "";
    return `<li style="margin-bottom:14px">${t(locale, "review", { WHERE: course })}${grade}${feedback}<br><a href="${url}">${t(locale, "open")}</a></li>`;
  }
  const message = n.message;
  const where = `#${escapeHtml(await channelName(message.channel, locale))} (${course})`;
  const from = escapeHtml(fullName(message.users_permissions_user));
  const url = `${frontendUrl}/space/${n.spaceUid}/forum/channel/${message.channel?.uid || ""}`;
  return `<li style="margin-bottom:14px">${t(locale, n.type, { FROM: from, WHERE: where })}<br><em>${escapeHtml(plainExcerpt(message.text))}</em><br><a href="${url}">${t(locale, "open")}</a></li>`;
};

let running = false;

/** Sends the queued notifications that are due. Called by the cron task every few minutes. */
export const processNotifications = async () => {
  if (running || !notificationsEnabled()) return;
  running = true;
  courseNames.clear();
  try {
    const due = await strapi.entityService.findMany(NOTIFICATION, {
      filters: { status: "pending", sendAfter: { $lte: new Date() } },
      populate: {
        user: true,
        message: {
          populate: {
            users_permissions_user: { fields: ["id", "name", "lastname", "username"] },
            parent: { populate: { users_permissions_user: { fields: ["id"] } } },
            channel: { fields: ["id", "uid", "name"] },
          },
        },
        submission: true,
        announcement: true,
      },
      sort: { id: "asc" },
      limit: MAX_PER_RUN,
    });
    if (!due.length) return;

    const site = await getSite();
    const digests = new Map<number, any[]>();

    for (const n of due) {
      try {
        const reason = await cancelReason(n);
        if (reason) {
          await setStatus(n.id, "cancelled", reason);
          continue;
        }
        const locale = n.user.locale || site.defaultLocale;
        const name = escapeHtml(n.user.name || n.user.username || "");

        if (n.type === "announcement") {
          const { subject, html } = await renderEmail("announcement", locale, {
            NAME: name,
            COURSE: escapeHtml(await courseName(n.spaceUid, locale)),
            SUBJECT: escapeHtml(n.announcement.subject),
            TEXT: textToHtml(n.announcement.text),
            URL: `${site.frontendUrl}/space/${n.spaceUid}`,
          });
          await sendEmail(n.user.email, subject, html);
          await setStatus(n.id, "sent");
        } else if (n.type === "reminder") {
          const space = removeDrafts(
            await findSpaceWithFallback(n.spaceUid, locale, {
              populate: ["content_modules", "content_modules.units", "content_modules.units.lessons"],
            })
          );
          const progresses = await strapi.entityService.findMany("api::progress.progress", {
            filters: { users_permissions_user: { id: n.user.id }, learning_space: { uid: n.spaceUid } },
            populate: ["unit", "lesson"],
            limit: -1,
          });
          const completion = courseCompletion(space, progresses);
          if (!space || completion.isComplete) {
            await setStatus(n.id, "cancelled", "course completed");
            continue;
          }
          const { subject, html } = await renderEmail("course_reminder", locale, {
            NAME: name,
            COURSE: escapeHtml(space.name),
            COMPLETED: String(completion.completed),
            TOTAL: String(completion.total),
            URL: `${site.frontendUrl}/space/${n.spaceUid}`,
          });
          await sendEmail(n.user.email, subject, html);
          await setStatus(n.id, "sent");
        } else {
          if (!digests.has(n.user.id)) digests.set(n.user.id, []);
          digests.get(n.user.id).push(n);
        }
      } catch (error) {
        strapi.log.error(`[notifications] #${n.id} failed: ${error?.message || error}`);
        await setStatus(n.id, "failed", String(error?.message || error).slice(0, 1000));
      }
    }

    for (const items of digests.values()) {
      const user = items[0].user;
      const locale = user.locale || site.defaultLocale;
      try {
        const list = (await Promise.all(items.map((n) => digestItem(n, locale, site.frontendUrl)))).join("");
        const { subject, html } = await renderEmail("notification_digest", locale, {
          NAME: escapeHtml(user.name || user.username || ""),
          ITEMS: `<ul style="padding-left:18px">${list}</ul>`,
          URL: site.frontendUrl,
        });
        await sendEmail(user.email, subject, html);
        for (const n of items) await setStatus(n.id, "sent");
      } catch (error) {
        strapi.log.error(`[notifications] digest for user ${user.id} failed: ${error?.message || error}`);
        for (const n of items) await setStatus(n.id, "failed", String(error?.message || error).slice(0, 1000));
      }
    }
  } finally {
    running = false;
  }
};

// ---------------------------------------------------------------------------------------------
// Reminders

const DAY = 24 * 60 * 60 * 1000;

/**
 * Queues a reminder for learners who haven't finished a course and haven't completed any page
 * for `reminderDays` days (a course setting; empty = no reminders). One reminder per period of
 * inactivity, and none after 4 × reminderDays, so old abandoned enrollments aren't emailed.
 */
export const scheduleReminders = async () => {
  if (!notificationsEnabled()) return;
  const site = await getSite();
  const withReminders = await strapi.entityService.findMany("api::learning-space.learning-space", {
    filters: { reminderDays: { $gt: 0 }, publishedAt: { $ne: null } },
    fields: ["uid", "reminderDays"],
    locale: "all",
  });
  const uids = new Map<string, number>();
  for (const s of withReminders) if (s.uid) uids.set(s.uid, s.reminderDays);

  let queued = 0;
  for (const [spaceUid, reminderDays] of uids) {
    const space = removeDrafts(
      await findSpaceWithFallback(spaceUid, site.defaultLocale, {
        populate: ["content_modules", "content_modules.units", "content_modules.units.lessons"],
      })
    );
    if (!space) continue;

    const enrollments = await strapi.entityService.findMany("api::enrollment.enrollment", {
      filters: { learning_space: { uid: spaceUid } },
      populate: { users_permissions_user: { fields: ["id", "blocked", "emailNotifications"] } },
      limit: -1,
    });
    const progresses = await strapi.entityService.findMany("api::progress.progress", {
      filters: { learning_space: { uid: spaceUid } },
      populate: { users_permissions_user: { fields: ["id"] }, unit: true, lesson: true },
      limit: -1,
    });

    // Some learners have several enrollment entries: keep the latest date per learner.
    const enrolledAt = new Map<number, { user: any; at: number }>();
    for (const enrollment of enrollments) {
      const user = enrollment.users_permissions_user;
      if (!user) continue;
      const at = new Date(enrollment.date || enrollment.createdAt).getTime();
      if (!enrolledAt.has(user.id) || enrolledAt.get(user.id).at < at) enrolledAt.set(user.id, { user, at });
    }

    for (const { user, at } of enrolledAt.values()) {
      if (user.blocked || user.emailNotifications === false) continue;

      const own = progresses.filter((p: any) => p.users_permissions_user?.id === user.id);
      if (courseCompletion(space, own).isComplete) continue;

      const lastActivity = Math.max(at, ...own.map((p: any) => new Date(p.createdAt).getTime()));
      const idle = Date.now() - lastActivity;
      if (idle < reminderDays * DAY || idle > reminderDays * 4 * DAY) continue;

      const already = await exists({
        type: "reminder",
        user: { id: user.id },
        spaceUid,
        createdAt: { $gt: new Date(lastActivity) },
      });
      if (already) continue;

      await strapi.entityService.create(NOTIFICATION, {
        data: { type: "reminder", user: user.id, spaceUid, status: "pending", sendAfter: new Date() },
      });
      queued++;
    }
  }
  if (queued) strapi.log.info(`[notifications] queued ${queued} course reminder(s)`);
};
