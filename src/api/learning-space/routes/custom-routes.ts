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
    {
      method: "GET",
      path: "/learning-spaces/admin/:uid/quiz-attempts",
      handler: "learning-space.adminQuizAttempts",
    },
    {
      method: "GET",
      path: "/learning-spaces/admin/:uid/submissions",
      handler: "learning-space.adminSubmissions",
    },
    {
      method: "GET",
      path: "/learning-spaces/admin/:uid/announcements",
      handler: "learning-space.adminAnnouncements",
    },
    {
      method: "POST",
      path: "/learning-spaces/admin/:uid/announcements",
      handler: "learning-space.adminCreateAnnouncement",
    },
    {
      method: "DELETE",
      path: "/learning-spaces/admin/:uid/announcements/:id",
      handler: "learning-space.adminCancelAnnouncement",
    },
  ],
};
