export default {
  routes: [
    {
      method: "PUT",
      path: "/submissions/:id/review",
      handler: "submission.review",
    },
  ],
};
