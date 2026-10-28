export default {
  routes: [
    {
      method: "POST",
      path: "/quiz-attempts/submit",
      handler: "quiz-attempt.submit",
    },
  ],
};
