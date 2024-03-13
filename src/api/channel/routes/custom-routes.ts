/**
 * account router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/channels/messages/:id",
      handler: "channel.findMessages",
    },
    {
      method: "GET",
      path: "/channels/user/:forumid/:userid",
      handler: "channel.findUserMessages",
    }
  ],
};
