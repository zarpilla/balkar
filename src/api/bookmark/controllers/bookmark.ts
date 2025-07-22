/**
 * bookmark controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController(
  "api::bookmark.bookmark",
  ({ strapi }) => ({
    create: async (ctx, next) => {
      const userId = ctx.state.user.id;
      const uid = ctx.request.body.data.uid;

      if (
        ctx.request.body.data.module &&
        ctx.request.body.data.unit 
        //&& ctx.request.body.data.lesson
      ) {
        const moduleId = ctx.request.body.data.module;
        const unitId = ctx.request.body.data.unit;
        const lessonId = ctx.request.body.data.lesson;
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
          const bookmark = await strapi.entityService.create(
            "api::bookmark.bookmark",
            {
              data: {
                users_permissions_user: userId,
                learning_space: space.id,
                module: moduleId,
                unit: unitId,
                lesson: lessonId,
              },
            }
          );
          ctx.status = 200;
          ctx.body = { ok: true };
        }
      } else {
        ctx.status = 400;
        ctx.body = { ok: false, message: "Invalid data" };
      }
      return;
    },
    delete: async (ctx, next) => {
      const userId = ctx.state.user.id;
      const uid = ctx.request.body.data.uid;

      if (
        ctx.request.body.data.module &&
        ctx.request.body.data.unit 
        // && ctx.request.body.data.lesson
      ) {
        const moduleId = ctx.request.body.data.module;
        const unitId = ctx.request.body.data.unit;
        const lessonId = ctx.request.body.data.lesson;
        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              uid: uid,
            },
          }
        );
        const space: any = spaces[0];
        const filters = {
          users_permissions_user: userId,
          learning_space: space.id,
          module: moduleId,
          unit: unitId
        };
        if (lessonId) {
          filters["lesson"] = lessonId;
        }
        const bookmarks = await strapi.entityService.findMany(
          "api::bookmark.bookmark",
          {
            filters: filters,
          }
        );

        for await (const bookmark of bookmarks) {
          await strapi.entityService.delete(
            "api::bookmark.bookmark",
            bookmark.id
          );
        }
        ctx.status = 200;
        ctx.body = { ok: true };
      } else {
        ctx.status = 400;
        ctx.body = { ok: false, message: "Invalid data" };
      }
      return;
    },
  })
);
