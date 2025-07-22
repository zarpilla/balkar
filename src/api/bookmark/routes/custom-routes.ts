/**
 * account router
 */

export default {
  routes: [
    {
      method: "POST",
      path: "/bookmarks/create",
      handler: "bookmark.create",
    },
    {
      method: "POST",
      path: "/bookmarks/delete",
      handler: "bookmark.delete",
    }
  ],
};
