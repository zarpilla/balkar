export default {
  routes: [
    {
      method: "GET",
      path: "/site-config",
      handler: "administration.siteConfig",
      config: { auth: false },
    },
  ],
};
