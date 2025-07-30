/**
 * account router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/learning-spaces/uid/:uid",
      handler: "learning-space.findUid",
    },
    {
      method: "GET",
      path: "/learning-spaces/mine",
      handler: "learning-space.findMine",
    },
    {
      method: "GET",
      path: "/learning-spaces/submissions",
      handler: "learning-space.fixSubmissions",
    },
    {
      method: "GET",
      path: "/learning-spaces/admin/:uid/users-progress",
      handler: "learning-space.adminUsersProgress",
    },
    {
      method: "GET",
      path: "/learning-spaces/admin/:uid/content-progress",
      handler: "learning-space.adminContentProgress",
    },
  ],
};
