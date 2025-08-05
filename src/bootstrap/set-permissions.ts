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
        populate: true
    });

    // Update permission to match new config
    const controllersToUpdate = Object.keys(newPermissions);

    const updatePromises = []
    controllersToUpdate.forEach(async (controller) => {
      newPermissions[controller].forEach(async (action) => {
        const permissionToAdd = `${controller}.${action}`
        if (!permissions.find(p => p.action === `${controller}.${action}`)) {
          const promise = strapi.query("plugin::users-permissions.permission").create({
            data: {
              action: permissionToAdd,
              role: publicRole.id
            }
          })
          updatePromises.push(promise)
        }
      })
    })

    await Promise.all(updatePromises);
}


async function start() {
    await setPermissions("authenticated",
      {
        "api::learning-space.learning-space": ["find", "findOne", "findUid", "findMine", "adminUsersProgress", "adminContentProgress"],
        "api::translation.translation": ["find"],
        "api::enrollment.enrollment": ["enroll", "autoenroll"],
        "api::progress.progress": ["complete", "notcomplete"],
        "api::bookmark.bookmark": ["create", "delete"],
        "api::submission.submission": ["create", "delete"],
        "api::forum.forum": ["find", "findOne", "findUid", "getUnreadCounts", "markChannelAsRead", "markChannelAsReadAll"],
        "api::channel.channel": ["findMessages", "createPrivateChannel"],
        "api::message.message": ["create", "find", "findOne", "findChildren", "update", "delete"],
        "api::interest.interest": ["find", "findOne"],
        "plugin::users-permissions.user": ["update"],
        "api::user-avatar.user-avatar": ["find", "findOne", "create", "update", "delete", "findMine"],
        "api::product.product": ["find", "findOne"],
        "api::payment-intent.payment-intent": ["create", "createCheckoutSession", "checkPaymentIntent"],
        "api::user-channel-read.user-channel-read": ["getChannelReadStatus", "getUserReadStatuses"],
        "api::subtitle.subtitle": ["findFileById", "findTranscriptById"],
        "plugin::i18n.locales": ["listLocales"],
      }
    );

    await setPermissions("public",
      {
        "api::translation.translation": ["find"],
        "api::product.product": ["find", "findOne"],
        "api::learning-space.learning-space": ["findUid"],        
        "api::pre-enrollement.pre-enrollement": ["create"],
        "api::payment-intent.payment-intent": ["create", "createCheckoutSession", "checkPaymentIntent", "sendPaymentEmails"],
        "api::user-avatar.user-avatar": ["forgotPassword"],
        "api::subtitle.subtitle": ["findFileById", "findTranscriptById"],
        // i18n listLocales
        "plugin::i18n.locales": ["listLocales"],
      }

    );
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
