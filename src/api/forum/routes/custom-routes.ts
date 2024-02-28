/**
 * account router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/forums/uid/:uid",
      handler: "forum.findUid",
    }
  ],
};
