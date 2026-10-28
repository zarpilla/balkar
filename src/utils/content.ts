/**
 * Course structure helpers shared by the course page, the managers' Admin tab, certificates and
 * reminders.
 */

declare const strapi: any;

const isPublished = (entry: any) => !!entry && !!entry.publishedAt;

/** Drops quiz blocks whose quiz is a draft (the block would render empty). */
const removeDraftQuizzes = (content: any[]) =>
  (content || []).filter(
    (block: any) => block?.__component !== "content.quiz" || !block.quiz || isPublished(block.quiz)
  );

/**
 * Removes draft modules, units and lessons from a learning space loaded with populate.
 * Only the course itself was checked before, so draft pages of a published course were shown.
 * Entries loaded without `publishedAt` (e.g. a restricted `fields` list) are kept.
 */
export const removeDrafts = (space: any) => {
  if (!space) return space;
  const keep = (entry: any) => !entry || !("publishedAt" in entry) || isPublished(entry);

  space.content_modules = (space.content_modules || []).filter(keep).map((module: any) => {
    if (Array.isArray(module.content)) module.content = removeDraftQuizzes(module.content);
    module.units = (module.units || []).filter(keep).map((unit: any) => {
      if (Array.isArray(unit.content)) unit.content = removeDraftQuizzes(unit.content);
      unit.lessons = (unit.lessons || []).filter(keep).map((lesson: any) => {
        if (Array.isArray(lesson.content)) lesson.content = removeDraftQuizzes(lesson.content);
        return lesson;
      });
      return unit;
    });
    return module;
  });
  return space;
};

// Progress entries point at one language version; uids are shared by all of them.
const sameEntry = (a: any, b: any) =>
  !!a && !!b && ((!!a.uid && a.uid === b.uid) || a.id === b.id);

/**
 * The pages a learner must complete to finish the course: every lesson, and every unit without
 * lessons, of the Content modules. Monitoring modules (follow-up activities, no "Mark as
 * completed" button on lesson-less units) don't count, as on the progress bar.
 */
export const requiredPages = (space: any) => {
  const pages: { kind: "lesson" | "unit"; entry: any; module: any; unit: any }[] = [];
  for (const module of space?.content_modules || []) {
    if (module.moduleType === "Monitoring") continue;
    for (const unit of module.units || []) {
      if (unit.lessons && unit.lessons.length) {
        for (const lesson of unit.lessons) pages.push({ kind: "lesson", entry: lesson, module, unit });
      } else {
        pages.push({ kind: "unit", entry: unit, module, unit });
      }
    }
  }
  return pages;
};

/**
 * Completion of a course for one learner, from their Progress entries (populated with unit and
 * lesson). A unit page counts only through a progress entry without lesson.
 */
export const courseCompletion = (space: any, progresses: any[]) => {
  const pages = requiredPages(space);
  const done = pages.filter((page) =>
    progresses.some((p: any) =>
      page.kind === "lesson"
        ? sameEntry(p.lesson, page.entry)
        : !p.lesson && sameEntry(p.unit, page.entry)
    )
  );
  return {
    total: pages.length,
    completed: done.length,
    isComplete: pages.length > 0 && done.length === pages.length,
  };
};

/**
 * Finds the published learning space with this uid in `locale`, or, when the course hasn't been
 * translated to that language, in the site's default language, or in any language.
 */
export const findSpaceWithFallback = async (uid: string, locale: string | undefined, params: any) => {
  const find = (loc: string) =>
    strapi.entityService.findMany("api::learning-space.learning-space", {
      ...params,
      filters: { ...(params.filters || {}), uid, publishedAt: { $ne: null } },
      locale: loc,
    });

  let spaces = await find(locale || "en");
  if (spaces.length) return spaces[0];

  const admin = await strapi.entityService.findMany("api::administration.administration", {});
  const defaultLocale = admin?.defaultLocale;
  if (defaultLocale && defaultLocale !== locale) {
    spaces = await find(defaultLocale);
    if (spaces.length) return spaces[0];
  }
  const any = await strapi.entityService.findMany("api::learning-space.learning-space", {
    filters: { uid, publishedAt: { $ne: null } },
    fields: ["locale"],
    locale: "all",
  });
  if (!any.length) return null;
  spaces = await find(any[0].locale);
  return spaces[0] || null;
};
