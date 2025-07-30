/**
 * user-avatar controller
 */

import { factories } from "@strapi/strapi";
import { nanoid } from "nanoid";

// export default factories.createCoreController('api::user-avatar.user-avatar');

export default factories.createCoreController(
  "api::user-avatar.user-avatar",
  ({ strapi }) => ({
    findMine: async (ctx, next) => {
      const avatars = await strapi.entityService.findMany(
        "api::user-avatar.user-avatar",
        {
          filters: {
            users_permissions_user: ctx.state.user.id,
          },
          populate: ["avatar"],
        }
      );

      if (avatars.length === 0) {
        // ctx.status = 504;
        ctx.body = { data: false };
      } else {
        const avatar: any = avatars[0];

        ctx.body = {
          data: avatar,
        };
      }
    },

    forgotPassword: async (ctx) => {
      console.log(
        "Forgot password request received from user-avatar controller"
      );
      const { email, locale } = ctx.request.body;
      if (!email) {
        return ctx.badRequest("Please provide your email");
      }

      // Find user by email
      const user = await strapi
        .query("plugin::users-permissions.user")
        .findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        return ctx.badRequest("This email does not exist");
      }
      if (user.blocked) {
        return ctx.badRequest("This user is disabled");
      }

      // Generate reset token
      const resetPasswordToken = nanoid(64);
      await strapi.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: { resetPasswordToken },
      });

      const administration = await strapi.entityService.findMany(
        "api::administration.administration",
        {
           populate: ["logo"],
        }
      );

      const resetPasswordFrontUrl = administration.resetPasswordFrontUrl;

      // Build reset URL
      const url = `${resetPasswordFrontUrl}${resetPasswordToken}`;
      const locale2 = locale || user.locale || "en";

      // Try to find localized email template
      const template = await strapi.entityService.findMany(
        "api::email-template.email-template",
        {
          filters: { type: "reset_password" },
          locale: locale2,
        }
      );


      const logoUrl = `${strapi.config.get("server.url")}${
        administration?.logo?.url || ""
      }`;

      const html = template[0].content
            .replace(/\{\{URL\}\}/g, url)
            .replace(/\{\{LOGO\}\}/g, logoUrl)
            .replace(/\{\{USER\}\}/g, user.username || user.email)
            .replace(/\{\{EMAIL\}\}/g, user.email)
            .replace(/\{\{NAME\}\}/g, user.name || user.username || user.email)

      if (template && template.length > 0) {
        await strapi.plugins["email"].services.email.send({
          to: user.email,
          subject: template[0].subject,
          html: html,
        });
        return ctx.send({ ok: true });
      }

      // fallback to default
      await strapi.plugins["email"].services.email.send({
        to: user.email,
        subject: "Reset password",
        text: `Click here to reset your password: ${url}`,
        html: `Click <a href="${url}">here</a> to reset your password.`,
      });
      return ctx.send({ ok: true });
    },
  })
);
