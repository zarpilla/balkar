/**
 * account router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/channels/messages/:uid",
      handler: "channel.findMessages",
    },
    {
      method: "GET",
      path: "/channels/user/:forumid/:userid",
      handler: "channel.findUserMessages",
    },
    {
      method: "POST",
      path: "/channels/private",
      handler: "channel.createPrivateChannel",
    },
    {
      // A learner creates a public channel (course option learnersCreateChannels)
      method: "POST",
      path: "/channels/create",
      handler: "channel.createChannel",
    }
  ],
};
