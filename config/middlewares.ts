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
      textLimit: 1 * 1024 * 1024 * 1024,
      formLimit: 1 * 1024 * 1024 * 1024,
      jsonLimit: 1 * 1024 * 1024 * 1024,
      includeUnparsed: true,
      formidable: {
        maxFileSize: 1 * 1024 * 1024 * 1024, // 1 GB
      },
      providerOptions: {
        sizeLimit: 1 * 1024 * 1024 * 1024, // 1 GB
      },
    },
  },
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
