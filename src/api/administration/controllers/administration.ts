/**
 * administration controller
 */

import { factories } from "@strapi/strapi";
import { notificationsEnabled } from "../../../utils/notifications";

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
  })
);
