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

      if (ctx.request.body.data.topicId && ctx.request.body.data.moduleId) {
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
                topicId: topicId,
                moduleId: moduleId,
              },
            }
          );
          ctx.status = 200;
          ctx.body = { ok: true };
        }
      } else if (
        ctx.request.body.data.module &&
        ctx.request.body.data.unit 
        //&& ctx.request.body.data.lesson
      ) {
        const moduleUid = ctx.request.body.data.module;
        const unitUid = ctx.request.body.data.unit;
        const lessonUid = ctx.request.body.data.lesson;
        
        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              uid: uid,
            },
            populate: [
              "content_modules",
              "content_modules.units",
              "content_modules.units.lessons",
            ],
          }
        );
        
        if (spaces.length === 0) {
          ctx.status = 504;
          ctx.body = { ok: false };
        } else {
          const space: any = spaces[0];
          
          // Find the actual IDs by matching UIDs
          let moduleId = null;
          let unitId = null;
          let lessonId = null;
          
          for (const module of space.content_modules) {
            if (module.uid.toString() === moduleUid) {
              moduleId = module.id;
              
              for (const unit of module.units) {
                if (unit.uid.toString() === unitUid) {
                  unitId = unit.id;
                  
                  if (lessonUid) {
                    for (const lesson of unit.lessons) {
                      if (lesson.uid.toString() === lessonUid) {
                        lessonId = lesson.id;
                        break;
                      }
                    }
                  }
                  break;
                }
              }
              break;
            }
          }
          
          if (!moduleId || !unitId) {
            ctx.status = 404;
            ctx.body = { ok: false, message: "Module or unit not found" };
            return;
          }
          
          const progress = await strapi.entityService.create(
            "api::progress.progress",
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
    notcomplete: async (ctx, next) => {
      const userId = ctx.state.user.id;
      const uid = ctx.request.body.data.uid;

      if (ctx.request.body.data.topicId && ctx.request.body.data.moduleId) {
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

        const filters = {
          users_permissions_user: userId,
          learning_space: space.id,
          moduleId: moduleId,
        };

        if (topicId) {
          filters["topicId"] = topicId;
        }

        const progresses = await strapi.entityService.findMany(
          "api::progress.progress",
          {
            filters: filters,
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
      } else if (
        ctx.request.body.data.module &&
        ctx.request.body.data.unit 
        // && ctx.request.body.data.lesson
      ) {
        const moduleUid = ctx.request.body.data.module;
        const unitUid = ctx.request.body.data.unit;
        const lessonUid = ctx.request.body.data.lesson;
        
        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              uid: uid,
            },
            populate: [
              "content_modules",
              "content_modules.units",
              "content_modules.units.lessons",
            ],
          }
        );
        
        const space: any = spaces[0];
        
        // Find the actual IDs by matching UIDs
        let moduleId = null;
        let unitId = null;
        let lessonId = null;
        
        for (const module of space.content_modules) {
          if (module.uid.toString() === moduleUid) {
            moduleId = module.id;
            
            for (const unit of module.units) {
              if (unit.uid.toString() === unitUid) {
                unitId = unit.id;
                
                if (lessonUid) {
                  for (const lesson of unit.lessons) {
                    if (lesson.uid.toString() === lessonUid) {
                      lessonId = lesson.id;
                      break;
                    }
                  }
                }
                break;
              }
            }
            break;
          }
        }
        
        if (!moduleId || !unitId) {
          ctx.status = 404;
          ctx.body = { ok: false, message: "Module or unit not found" };
          return;
        }
        
        const filters = {
          users_permissions_user: userId,
          learning_space: space.id,
          module: moduleId,
          unit: unitId
        };
        if (lessonId) {
          filters["lesson"] = lessonId;
        }
        const progresses = await strapi.entityService.findMany(
          "api::progress.progress",
          {
            filters: filters,
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
      } else {
        ctx.status = 400;
        ctx.body = { ok: false, message: "Invalid data" };
      }
      return;
    },
  })
);
