export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  // 'strapi::body',
  { name: 'strapi::body', config: { includeUnparsed: true } },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
