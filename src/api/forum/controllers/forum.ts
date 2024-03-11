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
            publishedAt: { $ne: null },
          },
          populate: [
            "forum",
            "forum.channels",
            "forum.channels.users_permissions_users",
          ],
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

        const channels = space.forum.channels.filter(
          (channel) =>
            channel.users_permissions_users.length === 0 ||
            (channel.users_permissions_users.length > 0 &&
              channel.users_permissions_users
                .map((user) => user.id)
                .includes(ctx.state.user.id))
        ).filter((channel) => channel.publishedAt);

        channels.forEach((channel) => {
          channel.users_permissions_users = channel.users_permissions_users.map(
            (user) => {
              return {
                id: user.id,
                username: user.username,
                name: user.name,
                lastname: user.lastname,
              };
            }
          );
        })

        space.forum.channels = channels;

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
        } else {
          const forumEnrollments = await strapi.entityService.findMany(
            "api::enrollment.enrollment",
            {
              filters: {
                learning_space: space.id,
              },
              populate: ["users_permissions_user"],
            }
          );

          const users = forumEnrollments
            .filter((e) => e.users_permissions_user)
            .map((enrollment) => {
              return {
                id: enrollment.users_permissions_user.id,
                username: enrollment.users_permissions_user.username,
                name: enrollment.users_permissions_user.name,
                lastname: enrollment.users_permissions_user.lastname,
              };
            });

          space.forum.users = users;
          ctx.body = space.forum;
        }
      }
    },
  })
);
