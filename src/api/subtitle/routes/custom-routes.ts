/**
 * account router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/subtitles/file/:id",
      handler: "subtitle.findFileById",
    },
  ],
};
