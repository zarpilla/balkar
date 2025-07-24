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
              "bannerIntro",
              "bannerOther",
              "modules.topics.contents",
              "modules.topics.contents.media",
              "product",
              "localizations",
              "content_modules",
              "content_modules.units",
              "content_modules.units.lessons",
              "content_modules.units.content",
              "content_modules.units.content.image",
              "content_modules.units.content.video",
              "content_modules.units.content.thumbnail",
              "content_modules.units.content.transcript",
              "content_modules.units.content.quiz",
              "content_modules.units.content.quiz.questions",
              "content_modules.units.content.quiz.questions.options",
              "content_modules.units.content.items",
              "content_modules.units.content.questions",
              "content_modules.units.lessons.content",
              "content_modules.units.lessons.content.image",
              "content_modules.units.lessons.content.video",
              "content_modules.units.lessons.content.thumbnail",
              "content_modules.units.lessons.content.transcript",
              "content_modules.units.lessons.content.items",
              "content_modules.units.lessons.content.quiz",
              "content_modules.units.lessons.content.quiz.questions",
              "content_modules.units.lessons.content.quiz.questions.options",
            ],
            locale: ctx.query.locale || "ca",
          }
        );

        const spaceForums = [];

        if (spaces.length === 0) {
          ctx.status = 504;
          ctx.body = { ok: false };
        } else {
          const space: any = spaces[0];

          const spacesLocalized = [
            space.id,
            ...space.localizations.map((l: any) => l.id),
          ];

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

            const enrollment = enrollments.find((enrollment) =>
              spacesLocalized.includes(enrollment.learning_space.id)
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
                    },
                  },
                },
                populate: ["module", "unit", "lesson"],
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
                    progress.topicId === null &&
                    progress.moduleId === module.moduleId
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

            const completed = [];
            const notCompleted = [];

            const bookmarks = await strapi.entityService.findMany(
              "api::bookmark.bookmark",
              {
                filters: {
                  users_permissions_user: ctx.state.user.id,
                  learning_space: space.id,
                },
                populate: ["module", "unit", "lesson"],
              }
            );

            for await (const module of space.content_modules) {
              for await (const unit of module.units) {
                for await (const lesson of unit.lessons) {
                  const progress = progresses.find(
                    (progress: any) =>
                      progress.lesson && progress.lesson.id === lesson.id
                  );
                  if (progress) {
                    lesson.completed = true;
                    completed.push(lesson);
                  } else {
                    lesson.completed = false;
                    notCompleted.push(lesson);
                  }

                  const bookmark = bookmarks.find(
                    (bookmark: any) =>
                      bookmark.lesson && bookmark.lesson.id === lesson.id
                  );
                  if (bookmark) {
                    lesson.bookmarked = true;
                  } else {
                    lesson.bookmarked = false;
                  }
                }
                if (unit.lessons && unit.lessons.length) {
                  unit.completedPct =
                    unit.lessons && unit.lessons.length
                      ? unit.lessons.filter((lesson: any) => lesson.completed)
                          .length / unit.lessons.length
                      : 0;
                  unit.completed = unit.completedPct === 1;
                } else {
                  const progress = progresses.find(
                    (progress: any) =>
                      progress.unit && progress.unit.id === unit.id
                  );
                  if (progress) {
                    unit.completed = true;
                    unit.completedPct = 1;
                    completed.push(unit);
                  } else {
                    unit.completed = false;
                    unit.completedPct = 0;
                    notCompleted.push(unit);
                  }
                }

                const bookmark = bookmarks.find(
                  (bookmark: any) =>
                    bookmark.unit && bookmark.unit.id === unit.id
                );
                if (bookmark) {
                  unit.bookmarked = true;
                } else {
                  unit.bookmarked = false;
                }
              }
              module.completedPct =
                module.units.filter((u) => u.completedPct === 1).length /
                module.units.length;
            }
            if (space.content_modules && space.content_modules.length) {
              space.contentCompletedPct =
                space.content_modules.filter((m) => m.completedPct === 1)
                  .length / space.content_modules.length;

              space.contentCompleted = completed.length;
              space.contentNotCompleted = notCompleted.length;
            }

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
                    },
                  },
                },
              }
            );

            spaceForums.push(...forums);
          }
          // const sanitizedResults: any = await sanitize.contentAPI.output(
          //   space,
          //   contentType,
          //   { auth: ctx.state.auth }
          // );

          // if (spaceForums.length) {
          //   sanitizedResults.forum = spaceForums[0];
          // }

          space.forum = spaceForums[0];

          ctx.body = space;
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
              "bannerIntro",
              "bannerOther",
              "modules.topics.contents",
              "modules.topics.contents.media",
              "localizations",
            ],
            locale: ctx.query.locale,
          }
        );

        const spacesUid = spaces.map((space: any) => space.uid);

        const spacesEnrolled = spaces.map((space: any) => {
          const enrollment = enrollments.find((enrollment) =>
            spacesUid.includes(enrollment.learning_space.uid)
          );
          if (enrollment) {
            space.enrolled = true;
            // return true;
          } else {
            space.enrolled = false;
            // return false;
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
      );

      const progresses = await strapi.entityService.findMany(
        "api::progress.progress",
        {
          limit: -1,
          populate: ["learning_space"],
        }
      );

      const response = [];
      for await (const progress of progresses) {
        const space = spaces.find(
          (s: any) => s.id === progress.learning_space.id
        );
        for await (const module of (space as any).modules) {
          if (progress.topicId) {
            for await (const topic of (module as any).topics) {
              if (
                progress.topicId === topic.id.toString() &&
                progress.moduleId === module.id.toString()
              ) {
                const resp = await strapi.entityService.update(
                  "api::progress.progress",
                  progress.id,
                  {
                    data: { topicId: topic.topicId, moduleId: module.moduleId },
                  }
                );
                response.push(resp);
              }
            }
          } else {
            if (progress.moduleId === module.id.toString()) {
              const resp = await strapi.entityService.update(
                "api::progress.progress",
                progress.id,
                { data: { moduleId: module.moduleId } }
              );
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
        const space = spaces.find(
          (s: any) => s.id === submission.learning_space.id
        );
        for await (const module of (space as any).modules) {
          if (submission.moduleId === module.id.toString()) {
            const resp = await strapi.entityService.update(
              "api::submission.submission",
              submission.id,
              { data: { moduleId: module.moduleId } }
            );
            response.push(resp);
          }
        }
      }

      ctx.body = { ok: true };
    },
  })
);
