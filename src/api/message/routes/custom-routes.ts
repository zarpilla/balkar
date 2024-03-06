/**
 * account router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/messages/children/:id",
      handler: "message.findChildren",
    }
  ],
};
