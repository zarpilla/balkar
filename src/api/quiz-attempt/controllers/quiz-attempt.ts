/**
 * quiz-attempt controller: the site records each quiz submission so course managers can see
 * the results. The score is computed here from the quiz, not taken from the browser.
 */

import { factories } from "@strapi/strapi";
import { canUseSpace } from "../../../utils/access";

export default factories.createCoreController(
  "api::quiz-attempt.quiz-attempt",
  ({ strapi }) => ({
    submit: async (ctx) => {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();

      const { spaceUid, quizId, pageUid, answers } = ctx.request.body?.data || {};
      if (!spaceUid || !quizId || !Array.isArray(answers)) {
        return ctx.badRequest("spaceUid, quizId and answers are required");
      }
      if (!(await canUseSpace(user, spaceUid))) {
        return ctx.forbidden("You are not enrolled in this course.");
      }

      const quiz: any = await strapi.entityService.findOne("api::quiz.quiz", quizId, {
        populate: { questions: { populate: ["options"] } },
      });
      if (!quiz) return ctx.notFound("Quiz not found");

      const questions = quiz.questions || [];
      const correct = questions.filter((question: any, index: number) => {
        const selected = answers[index];
        const option = (question.options || []).find((o: any) => o.id === selected);
        return !!option && !!option.correct;
      }).length;
      const total = questions.length;
      const score = total ? Math.round((correct / total) * 100) : 0;
      // Same rule as the quiz on the page: minToPass %, or every answer right when empty.
      const min = quiz.minToPass > 0 && quiz.minToPass <= 100 ? quiz.minToPass : 100;
      const passed = total > 0 && (correct / total) * 100 >= min;

      const space: any[] = await strapi.entityService.findMany("api::learning-space.learning-space", {
        filters: { uid: spaceUid },
        fields: ["id"],
        limit: 1,
      });

      await strapi.entityService.create("api::quiz-attempt.quiz-attempt", {
        data: {
          user: user.id,
          learning_space: space[0]?.id || null,
          spaceUid,
          quizUid: quiz.uid || String(quiz.id),
          quizTitle: quiz.title || null,
          pageUid: pageUid ? String(pageUid) : null,
          answers: answers.slice(0, total),
          correct,
          total,
          score,
          passed,
        },
      });

      ctx.body = { ok: true, correct, total, score, passed };
    },
  })
);
