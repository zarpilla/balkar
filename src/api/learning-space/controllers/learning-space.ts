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
            },
            populate: [
              "modules",
              "modules.topics",
              "banner",
              "modules.topics.contents",
              "modules.topics.contents.media",
              "forum",
            ],
          }
        );

        if (spaces.length === 0) {
          ctx.status = 504;
          ctx.body = { ok: false };
        } else {
          const space: any = spaces[0];

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
              (enrollment) => enrollment.learning_space.id === space.id
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
                  learning_space: space.id,
                },
              }
            );

            for await (const module of space.modules) {
              for await (const topic of module.topics) {
                const progress = progresses.find(
                  (progress: any) => progress.topicId === topic.id
                );
                if (progress) {
                  topic.completed = true;
                } else {
                  topic.completed = false;
                }
              }
              module.completedPct =
                module.topics && module.topics.length
                  ? module.topics.filter((topic: any) => topic.completed)
                      .length / module.topics.length
                  : 0;
            }

            space.completedPct =
              space.modules.filter((m) => m.completedPct === 1).length /
              space.modules.length;

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
                (submission: any) => submission.moduleId === module.id
              );
              if (moduleSubmissions) {
                module.submissions = moduleSubmissions;
              }
            }
          }
          const sanitizedResults: any = await sanitize.contentAPI.output(
            space,
            contentType,
            { auth: ctx.state.auth }
          );

          sanitizedResults.forum = space.forum;

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
              public: true,
            },
            populate: [
              "modules",
              "modules.topics",
              "banner",
              "modules.topics.contents",
              "modules.topics.contents.media",
            ],
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

        for await (const space of spacesEnrolled) {
          for await (const module of space.modules) {
            for await (const topic of module.topics) {
              const progress = progresses.find(
                (progress: any) =>
                  progress.topicId === topic.id &&
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
          spacesEnrolled,
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
  })
);
