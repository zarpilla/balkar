/**
 * Enrolling users in a course, shared by self-enrollment, auto-enrollment after login and the
 * course managers' bulk enrollment.
 */

declare const strapi: any;

/** The space (default-locale version) and whether it is paid: a product on any localization counts. */
export const findEnrollableSpace = async (uid: string) => {
  if (!uid) return null;
  const spaces = await strapi.entityService.findMany("api::learning-space.learning-space", {
    filters: { uid },
    populate: ["product"],
    locale: "all",
  });
  if (spaces.length === 0) return null;
  // Enrollments point at the default-locale version (the rest of the code matches by uid anyway).
  const defaultLocale = await strapi.plugin("i18n").service("locales").getDefaultLocale();
  const space = spaces.find((s: any) => s.locale === defaultLocale) || spaces[0];
  return { ...space, paid: spaces.some((s: any) => !!s.product) };
};

/** Today as YYYY-MM-DD in the site's time zone (TZ, default Europe/Madrid). */
const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: process.env.TZ || "Europe/Madrid" }).format(new Date());

/**
 * Is the course announced but not open yet? Coming soon is on and its start date (if any) hasn't
 * arrived: on that day the course opens by itself.
 */
export const isComingSoon = (space: any) =>
  !!space?.comingSoon && (!space.comingSoonDate || String(space.comingSoonDate).slice(0, 10) > today());

export const isEnrolledIn = async (userId: number, space: any) => {
  const existing = await strapi.entityService.findMany("api::enrollment.enrollment", {
    filters: { users_permissions_user: { id: userId }, learning_space: { uid: space.uid } },
    fields: ["id"],
    limit: 1,
  });
  return existing.length > 0;
};

/** Enrolls the user unless already enrolled. Returns whether an enrollment was created. */
export const enrollUser = async (userId: number, space: any) => {
  if (await isEnrolledIn(userId, space)) return false;
  await strapi.entityService.create("api::enrollment.enrollment", {
    data: { users_permissions_user: userId, learning_space: space.id },
  });
  return true;
};

const EMAIL = /[^\s<>(),;:"'\[\]]+@[^\s<>(),;:"'\[\]]+\.[A-Za-z]{2,}/g;

/** The distinct email addresses (lowercase) found in pasted text: lines, commas, "Name <email>"… */
export const extractEmails = (text: string) =>
  [...new Set((String(text || "").match(EMAIL) || []).map((e) => e.toLowerCase()))];

export type BulkEnrollStatus = "enrolled" | "already-enrolled" | "pre-enrolled" | "already-pre-enrolled";

/**
 * A course manager adds people by email. People with an account are enrolled now; the others get
 * a pre-enrollment (payment waived) that turns into an enrollment when they sign up or log in.
 */
export const bulkEnroll = async (space: any, emails: string[]) => {
  const results: { email: string; status: BulkEnrollStatus }[] = [];
  for (const email of emails) {
    const [user] = await strapi.entityService.findMany("plugin::users-permissions.user", {
      filters: { email: { $eqi: email } },
      fields: ["id"],
      limit: 1,
    });
    if (user) {
      results.push({ email, status: (await enrollUser(user.id, space)) ? "enrolled" : "already-enrolled" });
      continue;
    }
    const pre = await strapi.entityService.findMany("api::pre-enrollement.pre-enrollement", {
      filters: { email: { $eqi: email }, uid: space.uid },
      fields: ["id", "payment"],
    });
    if (pre.length) {
      for (const p of pre.filter((p: any) => !p.payment)) {
        await strapi.entityService.update("api::pre-enrollement.pre-enrollement", p.id, {
          data: { payment: true },
        });
      }
      results.push({ email, status: "already-pre-enrolled" });
    } else {
      await strapi.entityService.create("api::pre-enrollement.pre-enrollement", {
        data: { email, uid: space.uid, payment: true },
      });
      results.push({ email, status: "pre-enrolled" });
    }
  }
  return results;
};
