/**
 * enrollment controller
 *
 * A course with a product is paid: enrolling needs a pre-enrollment with payment = true for the
 * user's email (created after Stripe confirms the payment, or by an admin).
 */

import { factories } from "@strapi/strapi";
import { hasPaidPreEnrollment } from "../../../utils/access";
import { enrollUser, findEnrollableSpace, isComingSoon, isEnrolledIn } from "../../../utils/enrollments";

export default factories.createCoreController(
  "api::enrollment.enrollment",
  ({ strapi }) => ({
    enroll: async (ctx) => {
      const user = ctx.state.user;
      const uid = ctx.request.body?.data?.uid;

      const space: any = await findEnrollableSpace(uid);
      if (!space) {
        ctx.status = 404;
        ctx.body = { ok: false };
        return;
      }

      // Already enrolled (e.g. added by an admin): nothing to pay, nothing to do.
      if (await isEnrolledIn(user.id, space)) {
        ctx.body = { ok: true };
        return;
      }

      // Announced but not open yet (admins and managers can still enroll people).
      if (isComingSoon(space)) {
        ctx.status = 403;
        ctx.body = { ok: false, error: "coming-soon" };
        return;
      }

      if (space.paid && !(await hasPaidPreEnrollment(user.email, uid))) {
        ctx.status = 402;
        ctx.body = { ok: false, error: "payment-required" };
        return;
      }

      await enrollUser(user.id, space);
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
        const space: any = await findEnrollableSpace(pre.uid);
        if (space && space.paid && !pre.payment) {
          // Not paid: keep it, an admin may still tick "payment".
          continue;
        }
        if (space) {
          await enrollUser(user.id, space);
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
