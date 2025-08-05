/**
 * subtitle controller
 */
import { factories } from "@strapi/strapi";
import { sanitize } from "@strapi/utils";

export default factories.createCoreController(
  "api::subtitle.subtitle",
  ({ strapi }) => ({
    findFileById: async (ctx, next) => {
      // Handle CORS preflight
      if (ctx.request.method === "OPTIONS") {
        ctx.set("Access-Control-Allow-Origin", "*");
        ctx.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        ctx.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, Range"
        );
        ctx.status = 200;
        return;
      }

      const { id } = ctx.params;
      const entity = await strapi.entityService.findOne(
        "api::subtitle.subtitle",
        id
      );
      // content-type
      ctx.response.type = "text/vtt; charset=utf-8";
      // CORS headers
      ctx.set("Access-Control-Allow-Origin", "*");
      ctx.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      ctx.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Range"
      );
      return entity.text;
    },
    findTranscriptById: async (ctx, next) => {
      // Handle CORS preflight
      if (ctx.request.method === "OPTIONS") {
        ctx.set("Access-Control-Allow-Origin", "*");
        ctx.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        ctx.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, Range"
        );
        ctx.status = 200;
        return;
      }

      const { id } = ctx.params;
      const entity = await strapi.entityService.findOne(
        "api::subtitle.subtitle",
        id
      );
      // content-type
      ctx.response.type = "text/plain; charset=utf-8";
      // CORS headers
      ctx.set("Access-Control-Allow-Origin", "*");
      ctx.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      ctx.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Range"
      );
      ctx.set(
        "Content-Disposition",
        `attachment; filename="Transcript_${entity.name}_${entity.locale}.txt"`
      );

      return entity.transcript;
    },
  })
);
