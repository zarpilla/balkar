/**
 * progress controller
 */

import { factories } from "@strapi/strapi";

// export default factories.createCoreController('api::progress.progress');
export default factories.createCoreController(
  "api::progress.progress",
  ({ strapi }) => ({
    complete: async (ctx, next) => {
      const userId = ctx.state.user.id;
      const uid = ctx.request.body.data.uid;
      const topicId = ctx.request.body.data.topicId;
      const moduleId = ctx.request.body.data.moduleId;

      const spaces = await strapi.entityService.findMany(
        "api::learning-space.learning-space",
        {
          filters: {
            uid: uid,
          },
        }
      );

      if (spaces.length === 0) {
        ctx.status = 504;
        ctx.body = { ok: false };
      } else {
        const space: any = spaces[0];
        const progress = await strapi.entityService.create(
          "api::progress.progress",
          {
            data: {
              users_permissions_user: userId,
              learning_space: space.id,
              topicId,
              moduleId,
            },
          }
        );
        ctx.status = 200;
        ctx.body = { ok: true };
      }
    },
    notcomplete: async (ctx, next) => {
      const userId = ctx.state.user.id;
      const uid = ctx.request.body.data.uid;
      const topicId = ctx.request.body.data.topicId;
      const moduleId = ctx.request.body.data.moduleId;

      const spaces = await strapi.entityService.findMany(
        "api::learning-space.learning-space",
        {
          filters: {
            uid: uid,
          },
        }
      );

      const space: any = spaces[0];

      const progresses = await strapi.entityService.findMany(
        "api::progress.progress",
        {
          filters: {
            users_permissions_user: userId,
            learning_space: space.id,
            topicId: topicId ? parseInt(topicId) : null,
            moduleId: parseInt(moduleId),
          },
        }
      );

      for await (const progress of progresses) {
        await strapi.entityService.delete(
          "api::progress.progress",
          progress.id
        );
      }
      ctx.status = 200;
      ctx.body = { ok: true };
    },
  })
);
