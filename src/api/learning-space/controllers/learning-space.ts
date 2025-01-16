/**
 * learning-space controller
 */

import { factories } from "@strapi/strapi";
import { sanitize } from "@strapi/utils";
import _ from "lodash";

export default factories.createCoreController(
  "api::learning-space.learning-space",
  ({ strapi }) => ({
    findUid: async (ctx, next) => {
      try {
        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              uid: ctx.params.uid,
              publishedAt: { $ne: null },
            },
            populate: [
              "modules",
              "modules.topics",
              "modules.contents",
              "modules.contents.media",
              "banner",
              "modules.topics.contents",
              "modules.topics.contents.media",              
              "product",
              "localizations",
            ],
            locale: ctx.query.locale || "ca",            
          }
        );

        const spaceForums = []


        if (spaces.length === 0) {
          ctx.status = 504;
          ctx.body = { ok: false };
        } else {
          const space: any = spaces[0];

          const spacesLocalized = [space.id, ...space.localizations.map((l: any) => l.id)];

          space.product = space.product ? { id: space.product.id } : null;

          const contentType = strapi.contentType(
            "api::learning-space.learning-space"
          );

          if (ctx.state.user) {
            const enrollments = await strapi.entityService.findMany(
              "api::enrollment.enrollment",
              {
                filters: {
                  users_permissions_user: ctx.state.user.id,
                },
                populate: ["learning_space"],                
              }
            );

            const enrollment = enrollments.find(
              (enrollment) => spacesLocalized.includes(enrollment.learning_space.id)
            );

            if (enrollment) {
              space.enrolled = true;
            } else {
              space.enrolled = false;
            }

            const progresses = await strapi.entityService.findMany(
              "api::progress.progress",
              {
                filters: {
                  users_permissions_user: ctx.state.user.id,
                  learning_space: {
                    id: {
                      $in: spacesLocalized,
                    }
                  },
                },
              }
            );

            for await (const module of space.modules) {
              for await (const topic of module.topics) {
                const progress = progresses.find(
                  (progress: any) =>
                    progress.topicId === topic.topicId &&
                    progress.moduleId === module.moduleId
                );
                if (progress) {
                  topic.completed = true;
                } else {
                  topic.completed = false;
                }
              }
              if (
                module.topics &&
                module.topics.length &&
                module.moduleType !== "Monitoring"
              ) {
                module.completedPct =
                  module.topics && module.topics.length
                    ? module.topics.filter((topic: any) => topic.completed)
                        .length / module.topics.length
                    : 0;
              } else if (module.moduleType !== "Monitoring") {
                const progress = progresses.find(
                  (progress: any) =>
                    progress.topicId === null && progress.moduleId === module.moduleId
                );
                if (progress) {
                  module.completed = true;
                  module.completedPct = 1;
                } else {
                  module.completed = false;
                  module.completedPct = 0;
                }
              }
            }

            space.completedPct =
              space.modules.filter((m) => m.completedPct === 1).length /
              space.modules.filter((m) => m.moduleType !== "Monitoring").length;

            const submissions = await strapi.entityService.findMany(
              "api::submission.submission",
              {
                filters: {
                  users_permissions_user: ctx.state.user.id,
                  learning_space: space.id,
                },
                populate: ["file"],
              }
            );

            for await (const module of space.modules) {
              const moduleSubmissions = submissions.filter(
                (submission: any) => submission.moduleId === module.moduleId
              );
              if (moduleSubmissions) {
                module.submissions = moduleSubmissions;
              }
            }

            const forums = await strapi.entityService.findMany(
              "api::forum.forum",
              {
                filters: {
                  learning_space: {
                    id: {
                      $in: spacesLocalized,
                    }
                  },
                },
              }
            );

            spaceForums.push(...forums);

          }
          const sanitizedResults: any = await sanitize.contentAPI.output(
            space,
            contentType,
            { auth: ctx.state.auth }
          );

          if (spaceForums.length) {
            sanitizedResults.forum = spaceForums[0];
          }

          ctx.body = sanitizedResults;
        }
      } catch (err) {
        ctx.body = err;
      }
    },
    findMine: async (ctx, next) => {
      try {
        const enrollments = await strapi.entityService.findMany(
          "api::enrollment.enrollment",
          {
            filters: {
              users_permissions_user: ctx.state.user.id,
            },
            populate: ["learning_space"],
          }
        );

        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              publishedAt: { $ne: null },
            },
            populate: [
              "modules",
              "modules.topics",
              "modules.contents",
              "modules.contents.media",
              "banner",
              "modules.topics.contents",
              "modules.topics.contents.media",
            ],
            locale: ctx.query.locale,
          }
        );

        const spacesEnrolled = spaces.map((space: any) => {
          const enrollment = enrollments.find(
            (enrollment) => enrollment.learning_space.id === space.id
          );
          if (enrollment) {
            space.enrolled = true;
          } else {
            space.enrolled = false;
          }

          return space;
        });

        const progresses = await strapi.entityService.findMany(
          "api::progress.progress",
          {
            filters: {
              users_permissions_user: ctx.state.user.id,
              // learning_space: space.id,
            },
            populate: ["learning_space"],
          }
        );

        const spacesEnrolledOrPublic = spacesEnrolled.filter(
          (s: any) => s.enrolled || s.public
        );

        for await (const space of spacesEnrolledOrPublic) {
          for await (const module of space.modules) {
            for await (const topic of module.topics) {
              const progress = progresses.find(
                (progress: any) =>
                  progress.topicId === topic.topicId &&
                  progress.learning_space.id === space.id
              );
              if (progress) {
                topic.completed = true;
              } else {
                topic.completed = false;
              }
            }
            module.completedPct =
              module.topics && module.topics.length
                ? module.topics.filter((topic: any) => topic.completed).length /
                  module.topics.length
                : 0;
          }

          space.completedPct =
            space.modules.filter((m) => m.completedPct === 1).length /
            space.modules.length;
        }

        const contentType = strapi.contentType(
          "api::learning-space.learning-space"
        );

        const sanitizedResults = await sanitize.contentAPI.output(
          spacesEnrolledOrPublic,
          contentType,
          { auth: ctx.state.auth }
        );

        ctx.body = {
          data: sanitizedResults,
          meta: { total: spacesEnrolled.length },
        };
      } catch (err) {
        ctx.body = err;
      }
    },
    fixSubmissions: async (ctx, next) => {
      const spaces = await strapi.entityService.findMany(
        "api::learning-space.learning-space",
        {          
          populate: ["modules", "modules.topics"],
        }
      )
      
      const progresses = await strapi.entityService.findMany(
        "api::progress.progress",
        {
          limit: -1,
          populate: ["learning_space"],
        }
      );

      const response = []
      for await (const progress of progresses) {        
        const space = spaces.find((s: any) => s.id === progress.learning_space.id);
        for await (const module of (space as any).modules) {
          if (progress.topicId) {
            for await (const topic of (module  as any).topics) {
              if (progress.topicId === topic.id.toString() && progress.moduleId === module.id.toString()) {
                const resp = await strapi.entityService.update("api::progress.progress", progress.id, { data: { topic_id: topic.topicId, moduleId: module.moduleId } });
                response.push(resp);
              }
            }
          } else {
            if (progress.moduleId === module.id.toString()) {
              const resp = await strapi.entityService.update("api::progress.progress", progress.id, { data: { moduleId: module.moduleId } });
              response.push(resp);
            }
          }
        }
      }

      const submissions = await strapi.entityService.findMany(
        "api::submission.submission",
        {
          limit: -1,
          populate: ["learning_space"],
        }
      );

      for await (const submission of submissions) {
        const space = spaces.find((s: any) => s.id === submission.learning_space.id);
        for await (const module of (space as any).modules) {
          if (submission.moduleId === module.id.toString()) {
            const resp = await strapi.entityService.update("api::submission.submission", submission.id, { data: { moduleId: module.moduleId } });
            response.push(resp);
          }
        }
      }


      ctx.body = { ok: true };

    }
  })
);
