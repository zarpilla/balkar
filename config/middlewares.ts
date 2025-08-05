export default [
  "strapi::logger",
  "strapi::errors",
  "strapi::security",
  {
    name: "strapi::cors",
    config: {
      enabled: true,
      origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      headers: ["Content-Type", "Authorization", "Origin", "Accept", "Range"],
      keepHeaderOnError: true,
    },
  },
  "strapi::poweredBy",
  "strapi::query",
  // 'strapi::body',
  { name: "strapi::body", config: { includeUnparsed: true } },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
