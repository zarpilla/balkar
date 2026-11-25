/**
 * event controller
 *
 * Community activities of a course, shown in its Calendar tab when the course has
 * showCalendar on. Events are matched to the course by uid, so a translation may
 * point at any language version of the course.
 */

import { factories } from "@strapi/strapi";
import { canUseSpace } from "../../../utils/access";

const image = (media: any) =>
  media && media.url
    ? {
        url: media.url,
        width: media.width,
        height: media.height,
        alternativeText: media.alternativeText || "",
        formats: media.formats || null,
      }
    : null;

export default factories.createCoreController("api::event.event", ({ strapi }) => ({
  findBySpace: async (ctx) => {
    const uid = ctx.params.uid;
    const spaces: any[] = await strapi.entityService.findMany(
      "api::learning-space.learning-space",
      {
        filters: { uid, publishedAt: { $ne: null } },
        fields: ["id", "showCalendar"] as any,
        locale: "all",
      }
    );
    if (!spaces.length) return ctx.notFound("Course not found");
    if (!spaces.some((s) => s.showCalendar)) return ctx.notFound("This course has no calendar");
    if (!(await canUseSpace(ctx.state.user, uid))) {
      return ctx.forbidden("You are not enrolled in this course.");
    }

    const all: any[] = await strapi.entityService.findMany("api::event.event", {
      filters: { learning_space: { uid } },
      populate: ["image"],
      sort: { start: "asc" },
      locale: "all",
      limit: -1,
    });

    // One entry per event: the requested language, else the site's default, else any.
    const requested = (ctx.query.locale as string) || "en";
    const admin: any = await strapi.entityService.findMany("api::administration.administration", {});
    const defaultLocale = admin?.defaultLocale || "en";
    const rank = (e: any) => (e.locale === requested ? 0 : e.locale === defaultLocale ? 1 : 2);
    const byUid = new Map<string, any>();
    for (const e of all) {
      const key = e.uid || `id-${e.id}`;
      const current = byUid.get(key);
      if (!current || rank(e) < rank(current)) byUid.set(key, e);
    }

    ctx.body = {
      data: [...byUid.values()]
        .map((e) => ({
          id: e.id,
          uid: e.uid,
          title: e.title,
          description: e.description || "",
          start: e.start,
          end: e.end || null,
          image: image(e.image),
          locale: e.locale,
        }))
        .sort((a, b) => String(a.start).localeCompare(String(b.start))),
    };
  },
}));
