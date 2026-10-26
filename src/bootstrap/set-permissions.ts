// const strapi = require('@strapi/strapi')

async function setPermissions(roleType, newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi
    .query("plugin::users-permissions.role")
    .findOne({
      where: {
        type: roleType,
      },
    });

  const permissions = await strapi
    .query("plugin::users-permissions.permission")
    .findMany({
      where: {
        role: publicRole.id,
      },
      populate: true,
    });

  // Update permission to match new config
  const controllersToUpdate = Object.keys(newPermissions);

  const updatePromises = [];
  controllersToUpdate.forEach(async (controller) => {
    newPermissions[controller].forEach(async (action) => {
      const permissionToAdd = `${controller}.${action}`;
      if (!permissions.find((p) => p.action === `${controller}.${action}`)) {
        const promise = strapi
          .query("plugin::users-permissions.permission")
          .create({
            data: {
              action: permissionToAdd,
              role: publicRole.id,
            },
          });
        updatePromises.push(promise);
      }
    });
  });

  await Promise.all(updatePromises);
}

// Removes permissions that must not exist (some were granted by hand in the admin panel).
async function removePermissions(roleType, permissionsToRemove) {
  const role = await strapi
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: roleType } });
  const actions = Object.entries(permissionsToRemove).flatMap(
    ([controller, list]: [string, string[]]) => list.map((a) => `${controller}.${a}`)
  );
  // (deleteMany with a relation filter generates invalid SQL on Postgres: find the ids first)
  const found = await strapi
    .query("plugin::users-permissions.permission")
    .findMany({ where: { role: role.id, action: { $in: actions } }, select: ["id", "action"] });
  if (found.length) {
    await strapi
      .query("plugin::users-permissions.permission")
      .deleteMany({ where: { id: { $in: found.map((p) => p.id) } } });
    console.log(`Removed ${roleType} permission(s): ${found.map((p) => p.action).join(", ")}`);
  }
}

async function start() {
  await setPermissions("authenticated", {
    "api::learning-space.learning-space": [
      "findUid",
      "findMine",
      "adminUsersProgress",
      "adminContentProgress",
    ],
    "api::translation.translation": ["find"],
    "api::enrollment.enrollment": ["enroll", "autoenroll"],
    "api::progress.progress": ["complete", "notcomplete"],
    "api::bookmark.bookmark": ["create", "delete"],
    "api::submission.submission": ["create", "delete"],
    "api::forum.forum": [
      "find",
      "findOne",
      "findUid",
      "getUnreadCounts",
      "markChannelAsRead",
      "markChannelAsReadAll",
    ],
    "api::channel.channel": ["findMessages", "createPrivateChannel"],
    "api::message.message": [
      "create",
      "findChildren",
      "update",
      "delete",
    ],
    "api::interest.interest": ["find", "findOne"],
    "plugin::users-permissions.user": ["update"],
    "api::user-avatar.user-avatar": [
      "find",
      "findOne",
      "create",
      "update",
      "delete",
      "findMine",
    ],
    "api::product.product": ["find", "findOne"],
    "api::payment-intent.payment-intent": [
      "create",
      "createCheckoutSession",
      "checkPaymentIntent",
      "createCheckoutSessionForCertificate",
      "checkPaymentIntentForCertificate",
    ],
    "api::user-channel-read.user-channel-read": [
      "getChannelReadStatus",
      "getUserReadStatuses",
    ],
    "api::subtitle.subtitle": ["findFileById", "findTranscriptById"],
    "api::certificate.certificate": ["issue"],
    "plugin::i18n.locales": ["listLocales"],
  });

  await setPermissions("public", {
    "api::translation.translation": ["find"],
    "api::product.product": ["find", "findOne"],
    "api::learning-space.learning-space": ["findUid", "findMine"],
    "api::pre-enrollement.pre-enrollement": ["create"],
    "api::payment-intent.payment-intent": [
      "create",
      "createCheckoutSession",
      "checkPaymentIntent",
      "sendPaymentEmails",
      "createCheckoutSessionForCertificate",
      "checkPaymentIntentForCertificate",
    ],
    "api::user-avatar.user-avatar": ["forgotPassword"],
    "api::subtitle.subtitle": ["findFileById", "findTranscriptById"],
    // i18n listLocales
    "plugin::i18n.locales": ["listLocales"],
  });

  // The generic list endpoints return every course (with its content) or every forum message,
  // whatever the enrollment. The site only uses the uid / mine / channel endpoints, which check it.
  await removePermissions("public", {
    "api::learning-space.learning-space": ["find", "findOne"],
    "api::message.message": ["find", "findOne"],
  });
  await removePermissions("authenticated", {
    "api::learning-space.learning-space": ["find", "findOne"],
    "api::message.message": ["find", "findOne"],
  });
}

export default async () => {
  try {
    console.log("Setting permissions...");
    await start();
  } catch (error) {
    console.log("Could not set permissions");
    console.error(error);
  }
};
