/**
 * learning-space controller
 */

import { factories } from "@strapi/strapi";
import { toPublicSpace, removeInternalFields, isSpaceManager } from "../../../utils/access";
import { findSpaceWithFallback, removeDrafts } from "../../../utils/content";
import { notificationsEnabled, queueAnnouncement } from "../../../utils/notifications";
import { sanitize } from "@strapi/utils";
import _ from "lodash";

export default factories.createCoreController(
  "api::learning-space.learning-space",
  ({ strapi }) => ({
    findUid: async (ctx, next) => {
      try {
        // When the course isn't translated to the requested language, the default-language
        // version is returned (enrollment, payments and certificates already use it).
        const found = await findSpaceWithFallback(
          ctx.params.uid,
          (ctx.query.locale as string) || "en",
          {
            populate: [
              "banner",
              "bannerIntro",
              "bannerOther",
              "product",
              "localizations",
              "content_modules",
              "content_modules.content",
              "content_modules.content.image",
              "content_modules.content.video",
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
              "theme"
            ],
          }
        );
        const spaces = found ? [removeDrafts(found)] : [];

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
              module.completedPct = module.units.length
                ? module.units.filter((u) => u.completedPct === 1).length /
                  module.units.length
                : 0;
            }
            // Monitoring modules (migrated from Balkar) have no completion.
            const trackedModules = (space.content_modules || []).filter(
              (m) => m.moduleType !== "Monitoring"
            );
            if (trackedModules.length) {
              space.contentCompletedPct =
                trackedModules.filter((m) => m.completedPct === 1).length /
                trackedModules.length;

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

            // Content modules use the module uid as submission moduleId
            // (Balkar's migrated modules keep their old moduleId as uid).
            for (const module of space.content_modules || []) {
              module.submissions = submissions.filter(
                (submission: any) => submission.moduleId === module.uid
              );
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

          // Visitors and learners who aren't enrolled only get the course presentation and
          // outline, not the content of units and lessons.
          const fullAccess =
            !!ctx.state.user && (space.enrolled === true || space.manager === true);
          if (!fullAccess) {
            toPublicSpace(space);
            space.forum = null;
          }
          removeInternalFields(space);

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

        const allLocales = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              publishedAt: { $ne: null },
            },
            populate: [
              "banner",
              "bannerIntro",
              "bannerOther",
              "localizations",
            ],
            locale: "all",
          }
        );

        // One card per course: the requested language, else the site's default language, else
        // any language (courses not translated yet were missing from the dashboard).
        const requested = (ctx.query.locale as string) || "en";
        const admin: any = await strapi.entityService.findMany(
          "api::administration.administration",
          {}
        );
        const defaultLocale = admin?.defaultLocale || "en";
        const rank = (s: any) =>
          s.locale === requested ? 0 : s.locale === defaultLocale ? 1 : 2;
        const byUid = new Map<string, any>();
        for (const s of allLocales as any[]) {
          const key = s.uid || `id-${s.id}`;
          const current = byUid.get(key);
          if (!current || rank(s) < rank(current)) byUid.set(key, s);
        }
        const spaces = [...byUid.values()].sort((a: any, b: any) => a.id - b.id);

        const spacesEnrolled = spaces.map((space: any) => {
          // Enrollments point at the default-locale space; all localizations share its uid.
          const enrollment = enrollments.find(
            (enrollment) =>
              enrollment.learning_space &&
              enrollment.learning_space.uid === space.uid
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

        const contentType = strapi.contentType(
          "api::learning-space.learning-space"
        );

        // The dashboard only shows cards: no course content in this list.
        spacesEnrolledOrPublic.forEach((space: any) => {
          toPublicSpace(space);
          removeInternalFields(space);
        });

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
        const found = await findSpaceWithFallback(
          uid,
          (ctx.query.locale as string) || "en",
          {
            populate: [
              "content_modules",
              "content_modules.units",
              "content_modules.units.lessons",
              "localizations",
            ],
          }
        );
        const spaces = found ? [removeDrafts(found)] : [];

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

          // Progress by module, unit and lesson
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
            contentModules: contentModulesProgress,
            overallProgress: {
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
        const found = await findSpaceWithFallback(
          uid,
          (ctx.query.locale as string) || "en",
          {
            populate: [
              "content_modules",
              "content_modules.units",
              "content_modules.units.lessons",
              "localizations",
            ],
          }
        );
        const spaces = found ? [removeDrafts(found)] : [];

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
          // Completion by module, unit and lesson
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
            totalContentModules: space.content_modules?.length || 0,
          },
        };
      } catch (err) {
        console.error("Error in adminContentProgress:", err);
        ctx.status = 500;
        ctx.body = { ok: false, error: "Internal server error" };
      }
    },

    /** Quiz results of the course, for its managers. */
    adminQuizAttempts: async (ctx) => {
      const space = await loadManagedSpace(ctx, [
        "content_modules",
        "content_modules.units",
        "content_modules.units.content.quiz",
        "content_modules.units.lessons",
        "content_modules.units.lessons.content.quiz",
      ]);
      if (!space) return;

      // Quizzes in the course, in page order, with where they are.
      const quizzes: any[] = [];
      const addQuizzes = (content: any[], path: string[], pageTitle: string) => {
        for (const block of content || []) {
          if (block?.__component !== "content.quiz" || !block.quiz) continue;
          const quizUid = block.quiz.uid || String(block.quiz.id);
          if (quizzes.some((q) => q.quizUid === quizUid)) continue;
          quizzes.push({
            quizUid,
            title: block.quiz.title || pageTitle,
            pageTitle,
            path: path.filter(Boolean).join(" › "),
            minToPass: block.quiz.minToPass || null,
          });
        }
      };
      for (const module of space.content_modules || []) {
        for (const unit of module.units || []) {
          addQuizzes(unit.content, [module.title, unit.title], unit.title);
          for (const lesson of unit.lessons || []) {
            addQuizzes(lesson.content, [module.title, unit.title, lesson.title], lesson.title);
          }
        }
      }

      const attempts = await strapi.entityService.findMany("api::quiz-attempt.quiz-attempt", {
        filters: { spaceUid: space.uid },
        populate: { user: { fields: ["id", "name", "lastname", "email", "username"] } },
        sort: { createdAt: "asc" },
        limit: -1,
      });

      const rowsByKey = new Map<string, any>();
      for (const a of attempts as any[]) {
        if (!a.user) continue;
        const key = `${a.user.id}|${a.quizUid}`;
        if (!rowsByKey.has(key)) {
          rowsByKey.set(key, {
            user: { id: a.user.id, name: a.user.name, lastname: a.user.lastname, email: a.user.email },
            quizUid: a.quizUid,
            attempts: 0,
            bestScore: 0,
            lastScore: 0,
            passed: false,
            lastAt: null,
          });
          // Quizzes removed from the course still show up with their stored title.
          if (!quizzes.some((q) => q.quizUid === a.quizUid)) {
            quizzes.push({ quizUid: a.quizUid, title: a.quizTitle || a.quizUid, pageTitle: "", path: "", minToPass: null });
          }
        }
        const row = rowsByKey.get(key);
        row.attempts++;
        row.bestScore = Math.max(row.bestScore, a.score || 0);
        row.lastScore = a.score || 0;
        row.passed = row.passed || !!a.passed;
        row.lastAt = a.createdAt;
      }
      const rows = [...rowsByKey.values()];

      for (const quiz of quizzes) {
        const own = rows.filter((r) => r.quizUid === quiz.quizUid);
        quiz.learners = own.length;
        quiz.passed = own.filter((r) => r.passed).length;
        quiz.avgBestScore = own.length
          ? Math.round(own.reduce((sum, r) => sum + r.bestScore, 0) / own.length)
          : null;
      }

      ctx.body = { quizzes, rows, meta: { totalUsers: await countEnrolled(space.uid) } };
    },

    /** Files uploaded by learners, for review by the course managers. */
    adminSubmissions: async (ctx) => {
      const space = await loadManagedSpace(ctx, ["content_modules"]);
      if (!space) return;

      const moduleTitles = new Map<string, string>();
      for (const m of space.content_modules || []) moduleTitles.set(String(m.uid), m.title);

      const submissions = await strapi.entityService.findMany("api::submission.submission", {
        filters: { learning_space: { uid: space.uid } },
        populate: {
          file: true,
          users_permissions_user: { fields: ["id", "name", "lastname", "email"] },
          reviewedBy: { fields: ["id", "name", "lastname"] },
        },
        sort: { createdAt: "desc" },
        limit: -1,
      });

      ctx.body = {
        submissions: (submissions as any[]).map((s) => ({
          id: s.id,
          createdAt: s.createdAt,
          user: s.users_permissions_user
            ? {
                id: s.users_permissions_user.id,
                name: s.users_permissions_user.name,
                lastname: s.users_permissions_user.lastname,
                email: s.users_permissions_user.email,
              }
            : null,
          moduleUid: s.moduleId,
          moduleTitle: moduleTitles.get(String(s.moduleId)) || s.moduleId,
          files: (s.file || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            url: f.url,
            mime: f.mime,
            size: f.size,
          })),
          feedback: s.feedback || null,
          grade: s.grade || null,
          reviewedAt: s.reviewedAt || null,
          reviewedBy: s.reviewedBy ? { name: s.reviewedBy.name, lastname: s.reviewedBy.lastname } : null,
        })),
      };
    },

    adminAnnouncements: async (ctx) => {
      const space = await loadManagedSpace(ctx, []);
      if (!space) return;

      const announcements = await strapi.entityService.findMany("api::announcement.announcement", {
        filters: { spaceUid: space.uid },
        populate: { author: { fields: ["name", "lastname"] } },
        sort: { createdAt: "desc" },
        limit: -1,
      });
      const ids = (announcements as any[]).map((a) => a.id);
      const notifications = ids.length
        ? await strapi.entityService.findMany("api::notification.notification", {
            filters: { announcement: { id: { $in: ids } } },
            fields: ["status"],
            populate: { announcement: { fields: ["id"] } },
            limit: -1,
          })
        : [];

      ctx.body = {
        announcements: (announcements as any[]).map((a) => {
          const own = (notifications as any[]).filter((n) => n.announcement?.id === a.id);
          const count = (status: string) => own.filter((n) => n.status === status).length;
          return {
            id: a.id,
            subject: a.subject,
            text: a.text,
            createdAt: a.createdAt,
            author: a.author ? { name: a.author.name, lastname: a.author.lastname } : null,
            recipients: own.length,
            sent: count("sent"),
            pending: count("pending"),
            cancelled: count("cancelled"),
            cancellable: count("pending") > 0,
          };
        }),
      };
    },

    adminCreateAnnouncement: async (ctx) => {
      const space = await loadManagedSpace(ctx, []);
      if (!space) return;
      if (!notificationsEnabled()) {
        return ctx.forbidden("Notification emails are switched off on this site.");
      }

      const { subject, text } = ctx.request.body?.data || {};
      const cleanSubject = typeof subject === "string" ? subject.trim().slice(0, 200) : "";
      const cleanText = typeof text === "string" ? text.trim().slice(0, 20000) : "";
      if (!cleanSubject || !cleanText) return ctx.badRequest("subject and text are required");

      const announcement: any = await strapi.entityService.create("api::announcement.announcement", {
        data: {
          learning_space: space.id,
          spaceUid: space.uid,
          author: ctx.state.user.id,
          subject: cleanSubject,
          text: cleanText,
        },
      });
      const recipients = await queueAnnouncement(announcement, space.uid);

      ctx.body = {
        ok: true,
        announcement: {
          id: announcement.id,
          subject: announcement.subject,
          text: announcement.text,
          createdAt: announcement.createdAt,
          recipients,
        },
      };
    },

    /** Cancels the emails of an announcement that haven't been sent yet. */
    adminCancelAnnouncement: async (ctx) => {
      const space = await loadManagedSpace(ctx, []);
      if (!space) return;

      const announcement: any = await strapi.entityService.findOne(
        "api::announcement.announcement",
        ctx.params.id,
        { fields: ["id", "spaceUid"] }
      );
      if (!announcement || announcement.spaceUid !== space.uid) {
        return ctx.notFound("Announcement not found");
      }

      const pending = await strapi.entityService.findMany("api::notification.notification", {
        filters: { announcement: { id: announcement.id }, status: "pending" },
        fields: ["id"],
        limit: -1,
      });
      const ids = (pending as any[]).map((n) => n.id);
      if (ids.length) {
        await strapi.db.query("api::notification.notification").updateMany({
          where: { id: { $in: ids } },
          data: { status: "cancelled", error: "cancelled by a course manager" },
        });
      }
      ctx.body = { ok: true, cancelled: ids.length };
    },
  })
);

/**
 * The course with this uid (in ?locale=, with fallback, drafts removed) when the logged-in user
 * manages it; otherwise answers 403/404 and returns null.
 */
async function loadManagedSpace(ctx: any, populate: string[]) {
  const user = ctx.state.user;
  if (!user?.manager) {
    ctx.status = 403;
    ctx.body = { ok: false, error: "Only managers can access this endpoint" };
    return null;
  }
  const space = await findSpaceWithFallback(ctx.params.uid, (ctx.query.locale as string) || "en", {
    populate,
  });
  if (!space) {
    ctx.status = 404;
    ctx.body = { ok: false, error: "Learning space not found" };
    return null;
  }
  if (!(await isSpaceManager(user, space.uid))) {
    ctx.status = 403;
    ctx.body = { ok: false, error: "You are not a manager of this learning space" };
    return null;
  }
  return removeDrafts(space);
}

async function countEnrolled(spaceUid: string) {
  const enrollments = await strapi.entityService.findMany("api::enrollment.enrollment", {
    filters: { learning_space: { uid: spaceUid } },
    populate: { users_permissions_user: { fields: ["id"] } },
    limit: -1,
  });
  return new Set((enrollments as any[]).map((e) => e.users_permissions_user?.id).filter(Boolean)).size;
}
