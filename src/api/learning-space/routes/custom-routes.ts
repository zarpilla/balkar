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
  ],
};
