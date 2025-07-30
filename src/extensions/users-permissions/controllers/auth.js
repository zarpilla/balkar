const { sanitize } = require('@strapi/utils');
const { nanoid } = require('nanoid');

module.exports = {
  async forgotPassword(ctx) {
    console.log('Forgot password request received');
    const { email, locale } = ctx.request.body;
    if (!email) {
      return ctx.badRequest('Please provide your email');
    }

    // Find user by email
    const user = await strapi.query('plugin::users-permissions.user').findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return ctx.badRequest('This email does not exist');
    }
    if (user.blocked) {
      return ctx.badRequest('This user is disabled');
    }

    // Generate reset token
    const resetPasswordToken = nanoid(64);
    await strapi.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: { resetPasswordToken },
    });

    // Build reset URL
    const url = `${strapi.config.get('server.url')}/api/auth/reset-password?code=${resetPasswordToken}`;
    const locale2 = locale || user.locale || 'en';

    // Try to find localized email template
    const template = await strapi.entityService.findMany('api::email-template.email-template', {
      filters: { type: 'reset_password' },
      locale: locale2,
    });

    if (template && template.length > 0) {
      await strapi.plugins['email'].services.email.send({
        to: user.email,
        subject: template[0].subject,
        html: template[0].content
          .replace(/\{\{URL\}\}/g, url)
          .replace(/\{\{USER\}\}/g, user.username || user.email)
          .replace(/\{\{EMAIL\}\}/g, user.email)
          .replace(/\{\{NAME\}\}/g, user.name || user.username || user.email),
      });
      return ctx.send({ ok: true });
    }

    // fallback to default
    await strapi.plugins['email'].services.email.send({
      to: user.email,
      subject: 'Reset password',
      text: `Click here to reset your password: ${url}`,
      html: `Click <a href="${url}">here</a> to reset your password.`,
    });
    return ctx.send({ ok: true });
  },
};
