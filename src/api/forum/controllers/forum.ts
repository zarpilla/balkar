/**
 * forum controller
 */
import { factories } from "@strapi/strapi";
import { sanitize } from "@strapi/utils";
import _ from "lodash";

export default factories.createCoreController(
  "api::forum.forum",
  ({ strapi }) => ({
    findUid: async (ctx, next) => {
      const spaces = await strapi.entityService.findMany(
        "api::learning-space.learning-space",
        {
          filters: {
            uid: ctx.params.uid,
          },
          populate: ["forum", "forum.channels"],
        }
      );

      if (spaces.length === 0) {
        ctx.status = 504;
        ctx.body = { ok: false };
      } else {
        const space: any = spaces[0];

        if (!space.forum) {
            ctx.status = 504;
            ctx.body = { ok: false };
        }

        const enrollments = await strapi.entityService.findMany(
          "api::enrollment.enrollment",
          {
            filters: {
              users_permissions_user: ctx.state.user.id,
              learning_space: space.id,
            },
            populate: [],
          }
        );

        if (!enrollments) {
          ctx.status = 504;
          ctx.body = { ok: false };
        }
        else {
            ctx.body = space.forum;
        }
      }
    },
  })
);
