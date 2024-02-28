/**
 * account router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/channels/messages/:id",
      handler: "channel.findMessages",
    }
  ],
};
