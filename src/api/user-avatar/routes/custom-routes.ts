/**
 * account router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/user-avatars/mine",
      handler: "user-avatar.findMine",
    }
  ],
};
