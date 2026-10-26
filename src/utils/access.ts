/**
 * Shared access checks: enrollment, payments and what a non-enrolled visitor may see of a course.
 *
 * Spaces are matched by uid: every localization of a learning space shares the same uid, and
 * enrollments, pre-enrollments and certificate payments point at (or store) that uid.
 */

declare const strapi: any;

/** Is the user enrolled in the space with this uid (any localization)? */
export const isEnrolled = async (userId: number, spaceUid: string) => {
  if (!userId || !spaceUid) return false;
  const enrollments = await strapi.entityService.findMany(
    "api::enrollment.enrollment",
    {
      filters: {
        users_permissions_user: { id: userId },
        learning_space: { uid: spaceUid },
      },
      fields: ["id"],
      limit: 1,
    }
  );
  return enrollments.length > 0;
};

/** Is the user a manager of the space (user.manager + a SpaceManager record)? */
export const isSpaceManager = async (user: any, spaceUid: string) => {
  if (!user || !user.manager || !spaceUid) return false;
  const managers = await strapi.entityService.findMany(
    "api::space-manager.space-manager",
    {
      filters: { user: { id: user.id }, learning_space: { uid: spaceUid } },
      fields: ["id"],
      limit: 1,
    }
  );
  return managers.length > 0;
};

/**
 * Has this email paid for the course? Paid pre-enrollments are only created by the server after
 * Stripe confirms the checkout (payment-intent.checkPaymentIntent), or by an admin who ticks
 * "payment" by hand.
 */
export const hasPaidPreEnrollment = async (email: string, spaceUid: string) => {
  if (!email || !spaceUid) return false;
  const pre = await strapi.entityService.findMany(
    "api::pre-enrollement.pre-enrollement",
    {
      filters: { email: { $eqi: email }, uid: spaceUid, payment: true },
      fields: ["id"],
      limit: 1,
    }
  );
  return pre.length > 0;
};

/** Has this email paid (or been exempted from paying) for the course's certificate? */
export const hasCertificatePayment = async (email: string, spaceUid: string) => {
  if (!email || !spaceUid) return false;
  const payments = await strapi.entityService.findMany(
    "api::certificate-payment.certificate-payment",
    {
      filters: { email: { $eqi: email }, uid: spaceUid },
      fields: ["id"],
      limit: 1,
    }
  );
  return payments.length > 0;
};

const pick = (obj: any, keys: string[]) =>
  obj
    ? Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]))
    : obj;

/**
 * Reduces a learning space (as returned by findUid / findMine) to what anyone may see before
 * enrolling: the course presentation (name, banners, public description, public lesson, price,
 * theme) and the outline of the course (module, unit and lesson titles), but no unit or lesson
 * content, no private description and no certificate lesson.
 */
export const toPublicSpace = (space: any) => {
  space.privateDescription = null;
  space.certificateLesson = null;

  space.content_modules = (space.content_modules || []).map((module: any) => ({
    ...pick(module, ["id", "uid", "title", "shortTitle", "menuTitle", "moduleType", "uploadFiles", "locale"]),
    content: [],
    units: (module.units || []).map((unit: any) => ({
      ...pick(unit, ["id", "uid", "title", "shortTitle", "menuTitle", "locale"]),
      content: [],
      lessons: (unit.lessons || []).map((lesson: any) => ({
        ...pick(lesson, ["id", "uid", "title", "shortTitle", "locale"]),
        content: [],
      })),
    })),
  }));

  // Legacy modules component (pre-2026 content): keep the outline only.
  space.modules = (space.modules || []).map((module: any) => ({
    ...pick(module, ["id", "name", "moduleType", "uploadFiles", "moduleId"]),
    contents: [],
    topics: (module.topics || []).map((topic: any) => ({
      ...pick(topic, ["id", "name", "topicId"]),
      contents: [],
    })),
  }));

  return space;
};

/**
 * Fields that never leave the server: staff notification addresses, and the full copies of the
 * other language versions (only their id and locale are needed).
 */
export const removeInternalFields = (space: any) => {
  if (!space) return space;
  delete space.enrollmentEmails;
  if (Array.isArray(space.localizations)) {
    space.localizations = space.localizations.map((l: any) => pick(l, ["id", "locale"]));
  }
  return space;
};

/** May the user read or write in the space's forum? (enrolled, or manager of the space) */
export const canUseSpace = async (user: any, spaceUid: string) =>
  !!user &&
  ((await isEnrolled(user.id, spaceUid)) || (await isSpaceManager(user, spaceUid)));

/** May the user read the channel with this uid (shared by all its localizations)? */
export const canReadChannel = async (user: any, channelUid: string) => {
  if (!user || !channelUid) return false;
  const channels = await strapi.entityService.findMany("api::channel.channel", {
    filters: { uid: channelUid },
    populate: { forum: { populate: { learning_space: { fields: ["uid"] } } } },
    locale: "all",
  });
  const spaceUids = new Set<string>(
    channels.map((c: any) => c.forum?.learning_space?.uid).filter(Boolean)
  );
  for (const spaceUid of spaceUids) {
    if (await canUseSpace(user, spaceUid)) return true;
  }
  return false;
};
