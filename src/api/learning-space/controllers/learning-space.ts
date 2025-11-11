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
              "content_modules.units.content.logo",
              "content_modules.units.content.video",
              "content_modules.units.content.thumbnail",
              "content_modules.units.content.transcript",
              "content_modules.units.content.subtitle",
              "content_modules.units.content.subtitle.localizations",
              "content_modules.units.content.quiz",
              "content_modules.units.content.quiz.questions",
              "content_modules.units.content.quiz.questions.options",
              "content_modules.units.content.items",
              "content_modules.units.content.items.image",
              "content_modules.units.content.items.logo",
              "content_modules.units.content.questions",
              "content_modules.units.lessons.content",
              "content_modules.units.lessons.content.image",
              "content_modules.units.lessons.content.logo",
              "content_modules.units.lessons.content.video",
              "content_modules.units.lessons.content.thumbnail",
              "content_modules.units.lessons.content.transcript",
              "content_modules.units.lessons.content.subtitle",
              "content_modules.units.lessons.content.subtitle.localizations",
              "content_modules.units.lessons.content.items",
              "content_modules.units.lessons.content.items.image",
              "content_modules.units.lessons.content.items.logo",
              "content_modules.units.lessons.content.quiz",
              "content_modules.units.lessons.content.quiz.questions",
              "content_modules.units.lessons.content.quiz.questions.options",
              "publicLesson",
              "publicLesson.content",
              "publicLesson.content.image",
              "publicLesson.content.video",
              "publicLesson.content.thumbnail",
              "publicLesson.content.transcript",
              "publicLesson.content.subtitle",
              "publicLesson.content.subtitle.localizations",
              "publicLesson.content.items",
              "publicLesson.content.items.image",
              "publicLesson.content.items.logo",
              "publicLesson.content.quiz",
              "publicLesson.content.quiz.questions",
              "publicLesson.content.quiz.questions.options",
              "certificateLesson",
              "certificateLesson.content",
              "certificateLesson.content.image",
              "certificateLesson.content.video",
              "certificateLesson.content.thumbnail",
              "certificateLesson.content.transcript",
              "certificateLesson.content.subtitle",
              "certificateLesson.content.subtitle.localizations",
              "certificate",
              "certificateProduct",
            ],
            locale: ctx.query.locale || "en",
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

            if (ctx.state.user.manager) {
              // check if is manager of this space
              const spaceManager = await strapi.entityService.findMany(
                "api::space-manager.space-manager",
                {
                  filters: {
                    user: ctx.state.user.id,
                    learning_space: {
                      id: {
                        $in: spacesLocalized,
                      },
                    },
                  },
                  limit: -1,
                }
              );
              if (spaceManager.length > 0) {
                space.manager = true;
              } else {
                space.manager = false;
              }
            } else {
              space.manager = ctx.state.user.manager;
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
                limit: -1,
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
                  learning_space: {
                    id: {
                      $in: spacesLocalized,
                    },
                  },
                },
                populate: ["module", "unit", "lesson"],
                limit: -1,
              }
            );

            // Helper functions to match content by UID across all localizations
            const findProgressByUid = (lesson: any) => {
              return progresses.find((progress: any) => {
                if (!progress.lesson) return false;
                // If the lesson UID matches directly
                if (progress.lesson.uid === lesson.uid) return true;
                // If no UID on progress lesson, fall back to ID matching (backward compatibility)
                return progress.lesson.id === lesson.id;
              });
            };

            const findBookmarkByUid = (lesson: any) => {
              return bookmarks.find((bookmark: any) => {
                if (!bookmark.lesson) return false;
                // If the lesson UID matches directly
                if (bookmark.lesson.uid === lesson.uid) return true;
                // If no UID on bookmark lesson, fall back to ID matching (backward compatibility)
                return bookmark.lesson.id === lesson.id;
              });
            };

            const findUnitProgressByUid = (unit: any) => {
              return progresses.find((progress: any) => {
                if (!progress.unit) return false;
                // If the unit UID matches directly
                if (progress.unit.uid === unit.uid) return true;
                // If no UID on progress unit, fall back to ID matching (backward compatibility)
                return progress.unit.id === unit.id;
              });
            };

            const findUnitBookmarkByUid = (unit: any) => {
              return bookmarks.find((bookmark: any) => {
                if (!bookmark.unit) return false;
                // If the unit UID matches directly
                if (bookmark.unit.uid === unit.uid) return true;
                // If no UID on bookmark unit, fall back to ID matching (backward compatibility)
                return bookmark.unit.id === unit.id;
              });
            };

            for await (const module of space.content_modules) {
              for await (const unit of module.units) {
                for await (const lesson of unit.lessons) {
                  const progress = findProgressByUid(lesson);
                  if (progress) {
                    lesson.completed = true;
                    completed.push(lesson);
                  } else {
                    lesson.completed = false;
                    notCompleted.push(lesson);
                  }

                  const bookmark = findBookmarkByUid(lesson);
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
                  const progress = findUnitProgressByUid(unit);
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

                const bookmark = findUnitBookmarkByUid(unit);
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
                  learning_space: {
                    id: {
                      $in: spacesLocalized,
                    },
                  },
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

          space.certificate = space.certificate
            ? { id: space.certificate.id }
            : null;

          space.certificateProduct = space.certificateProduct
            ? { id: space.certificateProduct.id }
            : null;

          if (ctx.state.user && space.certificateProduct) {
            console.log(
              "Checking certificate payment for user:",
              ctx.state.user.email,
              "and space:",
              space.uid
            );
            const certificatePayments = await strapi.entityService.findMany(
              "api::certificate-payment.certificate-payment",
              {
                filters: {
                  email: ctx.state.user.email,
                  uid: space.uid,
                },
              }
            );

            if (certificatePayments && certificatePayments.length > 0) {
              space.certificatePayment = { paid: true };
            } else {
              space.certificatePayment = { paid: false };
            }
          } else if (ctx.state.user) {
            space.certificatePayment = { paid: true };
          }

          ctx.body = space;
        }
      } catch (err) {
        ctx.body = err;
      }
    },
    findMine: async (ctx, next) => {
      try {
        const enrollments = !ctx.state.user
          ? []
          : await strapi.entityService.findMany("api::enrollment.enrollment", {
              filters: {
                users_permissions_user: ctx.state.user.id,
              },
              populate: ["learning_space"],
            });

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

        const progresses = !ctx.state.user ?  [] : await strapi.entityService.findMany(
          "api::progress.progress",
          {
            filters: {
              users_permissions_user: ctx.state.user.id,
              // learning_space: space.id,
            },
            populate: ["learning_space"],
            limit: -1,
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
    adminUsersProgress: async (ctx, next) => {
      try {
        // Check if user is manager
        if (!ctx.state.user?.manager) {
          ctx.status = 403;
          ctx.body = {
            ok: false,
            error: "Only managers can access this endpoint",
          };
          return;
        }

        const uid = ctx.params.uid;

        // Find the learning space
        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              uid: uid,
              publishedAt: { $ne: null },
            },
            populate: [
              "modules",
              "modules.topics",
              "content_modules",
              "content_modules.units",
              "content_modules.units.lessons",
              "localizations",
            ],
            locale: ctx.query.locale || "en",
          }
        );

        if (spaces.length === 0) {
          ctx.status = 404;
          ctx.body = { ok: false, error: "Learning space not found" };
          return;
        }

        const space: any = spaces[0];
        const spacesLocalized = [
          space.id,
          ...space.localizations.map((l: any) => l.id),
        ];

        // Check if user is manager of this space
        const spaceManager = await strapi.entityService.findMany(
          "api::space-manager.space-manager",
          {
            filters: {
              user: ctx.state.user.id,
              learning_space: {
                id: {
                  $in: spacesLocalized,
                },
              },
            },
            limit: -1,
          }
        );

        if (spaceManager.length === 0) {
          ctx.status = 403;
          ctx.body = {
            ok: false,
            error: "You are not a manager of this learning space",
          };
          return;
        }

        // Get all enrollments for this space
        const allEnrollments = await strapi.entityService.findMany(
          "api::enrollment.enrollment",
          {
            filters: {
              learning_space: {
                id: {
                  $in: spacesLocalized,
                },
              },
            },
            populate: ["users_permissions_user"],
            limit: -1,
          }
        );

        // Filter out enrollments with null users
        const validEnrollments = allEnrollments.filter(
          (enrollment: any) => enrollment.users_permissions_user
        );

        // Get unique users (deduplicate by user ID)
        const uniqueUsersMap = new Map();
        validEnrollments.forEach((enrollment: any) => {
          const user = enrollment.users_permissions_user;
          uniqueUsersMap.set(user.id, user);
        });
        const uniqueUsers = Array.from(uniqueUsersMap.values());

        // Get all progress for this space
        const progresses = await strapi.entityService.findMany(
          "api::progress.progress",
          {
            filters: {
              learning_space: {
                id: {
                  $in: spacesLocalized,
                },
              },
            },
            populate: ["users_permissions_user", "module", "unit", "lesson"],
            limit: -1,
          }
        );

        // Organize data by users
        const usersProgress = uniqueUsers.map((user: any) => {
          const userProgresses = progresses.filter(
            (progress: any) =>
              progress.users_permissions_user &&
              progress.users_permissions_user.id === user.id
          );

          // Process old modules structure
          const modulesProgress =
            space.modules?.map((module: any) => {
              const topicsProgress =
                module.topics?.map((topic: any) => {
                  const progress = userProgresses.find(
                    (p: any) =>
                      p.topicId === topic.topicId &&
                      p.moduleId === module.moduleId
                  );
                  return {
                    topicId: topic.topicId,
                    name: topic.name,
                    completed: !!progress,
                    completedAt: progress?.createdAt || null,
                  };
                }) || [];

              const moduleProgress = userProgresses.find(
                (p: any) => p.topicId === null && p.moduleId === module.moduleId
              );

              return {
                moduleId: module.moduleId,
                name: module.name,
                moduleType: module.moduleType,
                completed: !!moduleProgress,
                completedAt: moduleProgress?.createdAt || null,
                topics: topicsProgress,
                completedPct: topicsProgress.length
                  ? topicsProgress.filter((t) => t.completed).length /
                    topicsProgress.length
                  : moduleProgress
                  ? 1
                  : 0,
              };
            }) || [];

          // Process new content modules structure
          const contentModulesProgress =
            space.content_modules?.map((module: any) => {
              const unitsProgress =
                module.units?.map((unit: any) => {
                  const lessonsProgress =
                    unit.lessons?.map((lesson: any) => {
                      const progress = userProgresses.find(
                        (p: any) =>
                          p.lesson?.uid === lesson.uid ||
                          p.lesson?.id === lesson.id
                      );
                      return {
                        uid: lesson.uid,
                        title: lesson.title,
                        completed: !!progress,
                        completedAt: progress?.createdAt || null,
                      };
                    }) || [];

                  const unitProgress = userProgresses.find(
                    (p: any) =>
                      p.unit?.uid === unit.uid || p.unit?.id === unit.id
                  );

                  return {
                    uid: unit.uid,
                    title: unit.title,
                    completed: !!unitProgress,
                    completedAt: unitProgress?.createdAt || null,
                    lessons: lessonsProgress,
                    completedPct: lessonsProgress.length
                      ? lessonsProgress.filter((l) => l.completed).length /
                        lessonsProgress.length
                      : unitProgress
                      ? 1
                      : 0,
                  };
                }) || [];

              return {
                uid: module.uid,
                title: module.title,
                units: unitsProgress,
                completedPct: unitsProgress.length
                  ? unitsProgress.filter((u) => u.completedPct === 1).length /
                    unitsProgress.length
                  : 0,
              };
            }) || [];

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            lastname: user.lastname,
            modules: modulesProgress,
            contentModules: contentModulesProgress,
            overallProgress: {
              modules: modulesProgress.length
                ? modulesProgress.filter((m) => m.completedPct === 1).length /
                  modulesProgress.length
                : 0,
              contentModules: contentModulesProgress.length
                ? contentModulesProgress.filter((m) => m.completedPct === 1)
                    .length / contentModulesProgress.length
                : 0,
            },
          };
        });

        ctx.body = {
          space: {
            id: space.id,
            uid: space.uid,
            name: space.name,
          },
          users: usersProgress,
          meta: {
            totalUsers: usersProgress.length,
            totalModules: space.modules?.length || 0,
            totalContentModules: space.content_modules?.length || 0,
          },
        };
      } catch (err) {
        console.error("Error in adminUsersProgress:", err);
        ctx.status = 500;
        ctx.body = { ok: false, error: "Internal server error" };
      }
    },
    adminContentProgress: async (ctx, next) => {
      try {
        // Check if user is manager
        if (!ctx.state.user?.manager) {
          ctx.status = 403;
          ctx.body = {
            ok: false,
            error: "Only managers can access this endpoint",
          };
          return;
        }

        const uid = ctx.params.uid;

        // Find the learning space
        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              uid: uid,
              publishedAt: { $ne: null },
            },
            populate: [
              "modules",
              "modules.topics",
              "content_modules",
              "content_modules.units",
              "content_modules.units.lessons",
              "localizations",
            ],
            locale: ctx.query.locale || "en",
          }
        );

        if (spaces.length === 0) {
          ctx.status = 404;
          ctx.body = { ok: false, error: "Learning space not found" };
          return;
        }

        const space: any = spaces[0];
        const spacesLocalized = [
          space.id,
          ...space.localizations.map((l: any) => l.id),
        ];

        // Check if user is manager of this space
        const spaceManager = await strapi.entityService.findMany(
          "api::space-manager.space-manager",
          {
            filters: {
              user: ctx.state.user.id,
              learning_space: {
                id: {
                  $in: spacesLocalized,
                },
              },
            },
            limit: -1,
          }
        );

        if (spaceManager.length === 0) {
          ctx.status = 403;
          ctx.body = {
            ok: false,
            error: "You are not a manager of this learning space",
          };
          return;
        }

        // Get all enrollments for this space
        const allEnrollments = await strapi.entityService.findMany(
          "api::enrollment.enrollment",
          {
            filters: {
              learning_space: {
                id: {
                  $in: spacesLocalized,
                },
              },
            },
            populate: ["users_permissions_user"],
            limit: -1,
          }
        );

        // Filter out enrollments with null users
        const validEnrollments = allEnrollments.filter(
          (enrollment: any) => enrollment.users_permissions_user
        );

        // Get unique users (deduplicate by user ID)
        const uniqueUsersMap = new Map();
        validEnrollments.forEach((enrollment: any) => {
          const user = enrollment.users_permissions_user;
          uniqueUsersMap.set(user.id, user);
        });
        const uniqueUsers = Array.from(uniqueUsersMap.values());

        // Get all progress for this space
        const progresses = await strapi.entityService.findMany(
          "api::progress.progress",
          {
            filters: {
              learning_space: {
                id: {
                  $in: spacesLocalized,
                },
              },
            },
            populate: ["users_permissions_user", "module", "unit", "lesson"],
            limit: -1,
          }
        );

        // Organize data by content structure
        const contentProgress = {
          // Old modules structure
          modules:
            space.modules?.map((module: any) => {
              const topics =
                module.topics?.map((topic: any) => {
                  const topicProgresses = progresses.filter(
                    (p: any) =>
                      p.users_permissions_user &&
                      p.topicId === topic.topicId &&
                      p.moduleId === module.moduleId
                  );

                  return {
                    topicId: topic.topicId,
                    name: topic.name,
                    completedBy: topicProgresses.map((p: any) => ({
                      id: p.users_permissions_user.id,
                      username: p.users_permissions_user.username,
                      email: p.users_permissions_user.email,
                      completedAt: p.createdAt,
                    })),
                    completionRate: uniqueUsers.length
                      ? topicProgresses.length / uniqueUsers.length
                      : 0,
                  };
                }) || [];

              const moduleProgresses = progresses.filter(
                (p: any) =>
                  p.users_permissions_user &&
                  p.topicId === null &&
                  p.moduleId === module.moduleId
              );

              return {
                moduleId: module.moduleId,
                title: module.title,
                moduleType: module.moduleType,
                topics: topics,
                completedBy: moduleProgresses.map((p: any) => ({
                  id: p.users_permissions_user.id,
                  username: p.users_permissions_user.username,
                  email: p.users_permissions_user.email,
                  completedAt: p.createdAt,
                })),
                completionRate: uniqueUsers.length
                  ? moduleProgresses.length / uniqueUsers.length
                  : 0,
              };
            }) || [],

          // New content modules structure
          contentModules:
            space.content_modules?.map((module: any) => {
              const units =
                module.units?.map((unit: any) => {
                  const lessons =
                    unit.lessons?.map((lesson: any) => {
                      const lessonProgresses = progresses.filter(
                        (p: any) =>
                          p.users_permissions_user &&
                          (p.lesson?.uid === lesson.uid ||
                            p.lesson?.id === lesson.id)
                      );

                      return {
                        uid: lesson.uid,
                        title: lesson.title,
                        completedBy: lessonProgresses.map((p: any) => ({
                          id: p.users_permissions_user.id,
                          username: p.users_permissions_user.username,
                          email: p.users_permissions_user.email,
                          completedAt: p.createdAt,
                        })),
                        completionRate: uniqueUsers.length
                          ? lessonProgresses.length / uniqueUsers.length
                          : 0,
                      };
                    }) || [];

                  const unitProgresses = progresses.filter(
                    (p: any) =>
                      p.users_permissions_user &&
                      (p.unit?.uid === unit.uid || p.unit?.id === unit.id)
                  );

                  return {
                    uid: unit.uid,
                    title: unit.title,
                    lessons: lessons,
                    completedBy: unitProgresses.map((p: any) => ({
                      id: p.users_permissions_user.id,
                      username: p.users_permissions_user.username,
                      email: p.users_permissions_user.email,
                      completedAt: p.createdAt,
                    })),
                    completionRate: uniqueUsers.length
                      ? unitProgresses.length / uniqueUsers.length
                      : 0,
                  };
                }) || [];
              return {
                uid: module.uid,
                title: module.title,
                units: units,
              };
            }) || [],
        };

        ctx.body = {
          space: {
            id: space.id,
            uid: space.uid,
            name: space.name,
          },
          content: contentProgress,
          meta: {
            totalUsers: uniqueUsers.length,
            totalModules: space.modules?.length || 0,
            totalContentModules: space.content_modules?.length || 0,
          },
        };
      } catch (err) {
        console.error("Error in adminContentProgress:", err);
        ctx.status = 500;
        ctx.body = { ok: false, error: "Internal server error" };
      }
    },
  })
);
