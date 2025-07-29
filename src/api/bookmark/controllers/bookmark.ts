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
