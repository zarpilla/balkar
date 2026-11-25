/**
 * administration controller
 */

import { factories } from "@strapi/strapi";
import { notificationsEnabled } from "../../../utils/notifications";
import { escapeHtml } from "../../../utils/email";

const DEFAULT_SITE_NAME = "Urban Resilience Research Network";

const mediaUrl = (media: any) => (media && media.url ? media.url : null);

export default factories.createCoreController(
  "api::administration.administration",
  ({ strapi }) => ({
    // Public branding settings for the front. Only exposes safe fields
    // (never paymentEmails or other admin data).
    siteConfig: async (ctx) => {
      const admin: any = await strapi.entityService.findMany(
        "api::administration.administration",
        { populate: ["logo", "logoHeader", "logoFooter", "favicon", "theme", "footerLogos", "footerLogos.image"] as any }
      );
      ctx.body = {
        siteName: admin?.siteName || null,
        logo: mediaUrl(admin?.logo),
        logoHeader: mediaUrl(admin?.logoHeader),
        logoFooter: mediaUrl(admin?.logoFooter),
        footerLogos: (admin?.footerLogos || [])
          .filter((l: any) => l.image)
          .map((l: any) => ({ image: mediaUrl(l.image), url: l.url || null, alt: l.alt || "" })),
        favicon: mediaUrl(admin?.favicon),
        styles: admin?.theme?.styles || null,
        defaultLocale: admin?.defaultLocale || null,
        publicHome: admin?.publicHome !== false,
        notificationsEnabled: notificationsEnabled(),
      };
    },

    // <title> and Open Graph tags for index.html. The front's nginx includes
    // this fragment (SSI) so link previews, which don't run JS, get the
    // values from the admin instead of the ones built into the image.
    siteHead: async (ctx) => {
      const admin: any = await strapi.entityService.findMany(
        "api::administration.administration",
        { populate: ["logo", "favicon"] as any }
      );
      // Media URLs are relative (/uploads/...): make them absolute with the
      // backend's public address, as seen through the reverse proxy.
      const origin = `${ctx.get("x-forwarded-proto") || ctx.protocol}://${ctx.get("x-forwarded-host") || ctx.host}`;
      const absolute = (url: string | null) =>
        url && url.startsWith("/") ? `${origin}${url}` : url;

      const name = escapeHtml(admin?.siteName || DEFAULT_SITE_NAME);
      const description = admin?.siteDescription ? escapeHtml(admin.siteDescription.trim()) : null;
      const image = absolute(mediaUrl(admin?.logo) || mediaUrl(admin?.favicon));

      const tags = [
        `<title>${name}</title>`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="${name}">`,
        `<meta property="og:title" content="${name}">`,
      ];
      if (description) {
        tags.push(`<meta name="description" content="${description}">`);
        tags.push(`<meta property="og:description" content="${description}">`);
      }
      if (image) tags.push(`<meta property="og:image" content="${escapeHtml(image)}">`);

      ctx.type = "text/html; charset=utf-8";
      ctx.body = tags.join("\n    ") + "\n";
    },
  })
);
