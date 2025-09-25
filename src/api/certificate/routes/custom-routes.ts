/**
 * account router
 */

export default {
  routes: [
    {
      method: "POST",
      path: "/certificates/issue/:uid",
      handler: "certificate.issue",
    }
  ],
};
