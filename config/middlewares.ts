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
  {
    name: "strapi::body",
    config: {
      enabled: true,
      multipart: true,
      textLimit: 2 * 1024 * 1024 * 1024,
      formLimit: 2 * 1024 * 1024 * 1024,
      jsonLimit: 2 * 1024 * 1024 * 1024,
      includeUnparsed: true,
      formidable: {
        maxFileSize: 2 * 1024 * 1024 * 1024, // 2 GB
      },
      providerOptions: {
        sizeLimit: 2 * 1024 * 1024 * 1024, // 2 GB
      },
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
