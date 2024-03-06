/**
 * user-avatar controller
 */

import { factories } from '@strapi/strapi'

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
      }
    })
)