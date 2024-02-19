/**
 * account router
 */

export default {
  routes: [
    {
      method: "POST",
      path: "/progresses/complete",
      handler: "progress.complete",
    },
    {
      method: "POST",
      path: "/progresses/notcomplete",
      handler: "progress.notcomplete",
    }
  ],
};
