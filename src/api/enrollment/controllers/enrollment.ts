/**
 * enrollment controller
 */

import { factories } from "@strapi/strapi";
import { sanitize } from "@strapi/utils";

export default factories.createCoreController(
  "api::enrollment.enrollment",
  ({ strapi }) => ({
    enroll: async (ctx, next) => {
      const userId = ctx.state.user.id;
      const uid = ctx.request.body.data.uid;

      const spaces = await strapi.entityService.findMany(
        "api::learning-space.learning-space",
        {
          filters: {
            uid: uid,
          },
          populate: ["product"],
        }
      );

      if (spaces.length === 0) {
        ctx.status = 504;
        ctx.body = { ok: false };
      } else {
        const space: any = spaces[0];
        if (space.product) {
          // we need to look for a pre-enrollement
          const preEnrollement = await strapi.entityService.findMany(
            "api::pre-enrollement.pre-enrollement",
            {
              filters: {
                email: ctx.state.user.email,
                uid: uid,
              },
            }
          );

          if (preEnrollement.length === 0) {
            ctx.status = 400;
            ctx.body = { ok: false };
            return;
          }
        }
        const enrollment = await strapi.entityService.create(
          "api::enrollment.enrollment",
          {
            data: {
              users_permissions_user: userId,
              learning_space: space.id,
            },
          }
        );
        ctx.status = 200;
        ctx.body = { ok: true };
      }
    },
    autoenroll: async (ctx, next) => {
      const preEnrollements = await strapi.entityService.findMany(
        "api::pre-enrollement.pre-enrollement",
        {
          filters: {
            email: ctx.state.user.email,
          },
        }
      );
      preEnrollements.forEach(async (preEnrollement) => {
        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              uid: preEnrollement.uid,
            },
          }
        );
        if (spaces.length > 0) {
          const space: any = spaces[0];
          const enrollment = await strapi.entityService.create(
            "api::enrollment.enrollment",
            {
              data: {
                users_permissions_user: ctx.state.user.id,
                learning_space: space.id,
              },
            }
          );
        }
      });
      const preEnrollementsId = preEnrollements.map(
        (preEnrollement) => preEnrollement.id
      );
      for await (const preEnrollementId of preEnrollementsId) {
        await strapi.entityService.delete(
          "api::pre-enrollement.pre-enrollement",
          preEnrollementId
        );
      }

      ctx.body = { ok: true, enrollements: preEnrollements.length };
    },
  })
);
