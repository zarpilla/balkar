export default {
  routes: [
    {
      method: "GET",
      path: "/site-config",
      handler: "administration.siteConfig",
      config: { auth: false },
    },
    {
      // <head> fragment the front's nginx includes in index.html (SSI), so
      // link previews (WhatsApp, Slack…), which don't run JS, see the site name.
      method: "GET",
      path: "/site-head",
      handler: "administration.siteHead",
      config: { auth: false },
    },
  ],
};
