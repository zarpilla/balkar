/**
 * submission controller
 */

import { factories } from "@strapi/strapi";
import { canUseSpace, isSpaceManager } from "../../../utils/access";
import { queueReviewNotification } from "../../../utils/notifications";

export default factories.createCoreController(
  "api::submission.submission",
  ({ strapi }) => ({
    /**
     * Learner upload. The API drops the learning_space relation from the request because the
     * authenticated role can't read courses through the generic endpoints, so the course is
     * linked here, after checking the learner is enrolled.
     */
    async create(ctx) {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();

      const body: any = ctx.request.body || {};
      let data: any = body.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          return ctx.badRequest("Invalid data");
        }
      }
      const spaceId = Number(data?.learning_space?.id ?? data?.learning_space);
      const space: any = spaceId
        ? await strapi.entityService.findOne("api::learning-space.learning-space", spaceId, {
            fields: ["uid"],
          })
        : null;
      if (!space?.uid) return ctx.badRequest("learning_space is required");
      if (!(await canUseSpace(user, space.uid))) {
        return ctx.forbidden("You are not enrolled in this course.");
      }

      const response: any = await super.create(ctx);
      const id = response?.data?.id;
      if (id) {
        await strapi.entityService.update("api::submission.submission", id, {
          data: { learning_space: space.id },
        });
      }
      return response;
    },

    /** A course manager leaves feedback and/or a grade on a learner's upload. */
    review: async (ctx) => {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();

      const submission: any = await strapi.entityService.findOne(
        "api::submission.submission",
        ctx.params.id,
        { populate: { learning_space: { fields: ["uid"] }, users_permissions_user: { fields: ["id"] } } }
      );
      const spaceUid = submission?.learning_space?.uid;
      if (!submission || !spaceUid) return ctx.notFound("Submission not found");
      if (!(await isSpaceManager(user, spaceUid))) {
        return ctx.forbidden("You are not a manager of this course.");
      }

      const { feedback, grade } = ctx.request.body?.data || {};
      const clean = (value: any, max: number) =>
        typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
      const data = {
        feedback: clean(feedback, 10000),
        grade: clean(grade, 100),
      };
      const reviewed = !!(data.feedback || data.grade);

      const updated: any = await strapi.entityService.update("api::submission.submission", submission.id, {
        data: {
          ...data,
          reviewedAt: reviewed ? new Date() : null,
          reviewedBy: reviewed ? user.id : null,
        },
      });

      if (reviewed) await queueReviewNotification(submission, spaceUid);

      ctx.body = {
        ok: true,
        submission: {
          id: updated.id,
          feedback: updated.feedback,
          grade: updated.grade,
          reviewedAt: updated.reviewedAt,
        },
      };
    },
  })
);
