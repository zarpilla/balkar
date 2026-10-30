const { nanoid } = require("nanoid");
const permissionsSetter = require("./bootstrap/set-permissions").default;
const { findTemplate } = require("./utils/email");
const { seedUiTexts } = require("./bootstrap/ui-texts");
const { setFieldDescriptions } = require("./bootstrap/field-descriptions");

module.exports = {
  async bootstrap() {
    console.log("Bootstrapping Backend...");

    await permissionsSetter();
    await seedUiTexts();
    try {
      await setFieldDescriptions(strapi);
    } catch (err) {
      strapi.log.error(`Field help texts not set: ${err.message}`);
    }

    // Override users-permissions email methods directly
    const originalSendConfirmationEmail =
      strapi.plugins["users-permissions"].services.user.sendConfirmationEmail;
    const originalSendResetPasswordEmail =
      strapi.plugins["users-permissions"].services.user.sendResetPasswordEmail;

    // Override confirmation email
    strapi.plugins["users-permissions"].services.user.sendConfirmationEmail =
      async function (user, originalSendConfirmationEmail) {
        console.log(
          "💌 sendConfirmationEmail called with locale:",
          user.locale
        );
        const locale = user.locale || "en";

        try {
          // Template in the user's language, else the site's default language, else English.
          const found = await findTemplate("email_confirmation", locale);
          const template = found ? [found] : [];

          if (template && template.length > 0) {
            if (!user.confirmationToken) {
              user.confirmationToken = nanoid(64);
              await strapi.query("plugin::users-permissions.user").update({
                where: { id: user.id },
                data: { confirmationToken: user.confirmationToken },
              });
            }
            const confirmationToken = user.confirmationToken;
            const url = `${strapi.config.get(
              "server.url"
            )}/api/auth/email-confirmation?confirmation=${confirmationToken}`;

            const administration = await strapi.entityService.findMany(
              "api::administration.administration",
              {
                populate: ["logo"],
              }
            );

            const logoUrl = `${strapi.config.get(
              "server.url"
            )}${administration?.logo?.url || ""}`;

            const html = template[0].content
                .replace(/\{\{URL\}\}/g, url)
                .replace(/\{\{LOGO\}\}/g, logoUrl)
                .replace(/\{\{USER\}\}/g, user.username || user.email)
                .replace(/\{\{EMAIL\}\}/g, user.email)
                .replace(
                  /\{\{NAME\}\}/g,
                  user.name || user.username || user.email
                );  

            // Use the localized template
            await strapi.plugins["email"].services.email.send({
              to: user.email,
              subject: template[0].subject,
                html: html,
            });

            strapi.log.info(
              `Sent localized confirmation email to ${user.email} in ${locale}`
            );
            return;
          }
        } catch (error) {
          strapi.log.error(
            "Error sending localized confirmation email:",
            error
          );
        }

        console.log("⚠️ Falling back to default confirmation email");
        // Fallback to original method
        return originalSendConfirmationEmail.call(this, user);
      };

    console.log("✅ Email method overrides installed successfully!");
  },
};
