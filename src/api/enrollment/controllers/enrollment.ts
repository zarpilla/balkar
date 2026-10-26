/**
 * enrollment controller
 *
 * A course with a product is paid: enrolling needs a pre-enrollment with payment = true for the
 * user's email (created after Stripe confirms the payment, or by an admin).
 */

import { factories } from "@strapi/strapi";
import { hasPaidPreEnrollment } from "../../../utils/access";

// The space (any localization) and whether it is paid: a product on any localization counts.
const findSpace = async (strapi, uid: string) => {
  if (!uid) return null;
  const spaces = await strapi.entityService.findMany(
    "api::learning-space.learning-space",
    { filters: { uid }, populate: ["product"], locale: "all" }
  );
  if (spaces.length === 0) return null;
  // Enrollments point at the default-locale version (the rest of the code matches by uid anyway).
  const defaultLocale = await strapi.plugin("i18n").service("locales").getDefaultLocale();
  const space = spaces.find((s: any) => s.locale === defaultLocale) || spaces[0];
  return { ...space, paid: spaces.some((s: any) => !!s.product) };
};

const enrollUser = async (strapi, userId: number, space: any) => {
  const existing = await strapi.entityService.findMany(
    "api::enrollment.enrollment",
    {
      filters: {
        users_permissions_user: { id: userId },
        learning_space: { uid: space.uid },
      },
      fields: ["id"],
      limit: 1,
    }
  );
  if (existing.length === 0) {
    await strapi.entityService.create("api::enrollment.enrollment", {
      data: { users_permissions_user: userId, learning_space: space.id },
    });
  }
};

export default factories.createCoreController(
  "api::enrollment.enrollment",
  ({ strapi }) => ({
    enroll: async (ctx) => {
      const user = ctx.state.user;
      const uid = ctx.request.body?.data?.uid;

      const space: any = await findSpace(strapi, uid);
      if (!space) {
        ctx.status = 404;
        ctx.body = { ok: false };
        return;
      }

      if (space.paid && !(await hasPaidPreEnrollment(user.email, uid))) {
        ctx.status = 402;
        ctx.body = { ok: false, error: "payment-required" };
        return;
      }

      await enrollUser(strapi, user.id, space);
      ctx.body = { ok: true };
    },

    // Called once per session after login: turns the user's pre-enrollments into enrollments.
    autoenroll: async (ctx) => {
      const user = ctx.state.user;
      const preEnrollements = await strapi.entityService.findMany(
        "api::pre-enrollement.pre-enrollement",
        { filters: { email: { $eqi: user.email } } }
      );

      let enrolled = 0;
      for (const pre of preEnrollements) {
        const space: any = await findSpace(strapi, pre.uid);
        if (space && space.paid && !pre.payment) {
          // Not paid: keep it, an admin may still tick "payment".
          continue;
        }
        if (space) {
          await enrollUser(strapi, user.id, space);
          enrolled++;
        }
        await strapi.entityService.delete(
          "api::pre-enrollement.pre-enrollement",
          pre.id
        );
      }

      ctx.body = { ok: true, enrollements: enrolled };
    },
  })
);
