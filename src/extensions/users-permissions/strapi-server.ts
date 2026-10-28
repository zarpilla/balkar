/**
 * users-permissions extension.
 *
 * PUT /api/users/:id is open to the "authenticated" role so learners can edit their profile, but
 * the plugin lets any logged-in user update ANY user, including email, role and the manager
 * flag. Restrict it to the user's own account and to profile fields.
 */

// Fields a learner can never change through the site.
const PROTECTED_FIELDS = [
  "id",
  "role",
  "manager",
  "blocked",
  "confirmed",
  "provider",
  "password",
  "resetPasswordToken",
  "confirmationToken",
  "learning_spaces",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
];

module.exports = (plugin: any) => {
  const originalUpdate = plugin.controllers.user.update;

  plugin.controllers.user.update = async (ctx: any) => {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (String(ctx.params.id) !== String(user.id)) {
      return ctx.forbidden("You can only edit your own account.");
    }
    const body = ctx.request.body || {};
    for (const field of PROTECTED_FIELDS) delete body[field];
    ctx.request.body = body;
    return originalUpdate(ctx);
  };

  return plugin;
};
