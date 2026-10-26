/**
 * pre-enrollement controller
 *
 * POST /pre-enrollements is public: the register form calls it (without a login yet) so that a
 * person who registers from a course page is enrolled in that course at their first login.
 * It must not be a way into paid courses, so it only accepts free, published courses, for an
 * account that exists, and never sets "payment". Paid pre-enrollments are created by the server
 * after Stripe confirms the payment (payment-intent.checkPaymentIntent) or by an admin.
 *
 * It always answers 200: the register form treats any error as "email already exists".
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::pre-enrollement.pre-enrollement",
  ({ strapi }) => ({
    create: async (ctx) => {
      const data = (ctx.request.body && ctx.request.body.data) || {};
      const email = typeof data.email === "string" ? data.email.trim() : "";
      const uid = typeof data.uid === "string" ? data.uid.trim() : "";
      const skip = () => {
        ctx.body = { ok: true, created: false };
      };

      if (!email || !uid) return skip();

      const spaces = await strapi.entityService.findMany(
        "api::learning-space.learning-space",
        {
          filters: { uid, publishedAt: { $ne: null } },
          populate: ["product"],
          locale: "all",
        }
      );
      // Paid if any localization has a product.
      if (spaces.length === 0 || spaces.some((s: any) => !!s.product)) return skip();

      const users = await strapi.entityService.findMany(
        "plugin::users-permissions.user",
        { filters: { email: { $eqi: email } }, fields: ["id"], limit: 1 }
      );
      if (users.length === 0) return skip();

      const existing = await strapi.entityService.findMany(
        "api::pre-enrollement.pre-enrollement",
        { filters: { email: { $eqi: email }, uid }, fields: ["id"], limit: 1 }
      );
      if (existing.length > 0) return skip();

      await strapi.entityService.create("api::pre-enrollement.pre-enrollement", {
        data: {
          email,
          uid,
          name: typeof data.name === "string" ? data.name : null,
          lastname: typeof data.lastname === "string" ? data.lastname : null,
          payment: false,
        },
      });
      ctx.body = { ok: true, created: true };
    },
  })
);
