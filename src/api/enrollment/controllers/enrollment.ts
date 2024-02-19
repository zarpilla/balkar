/**
 * enrollment controller
 */

import { factories } from '@strapi/strapi'
import { sanitize } from "@strapi/utils";

export default factories.createCoreController('api::enrollment.enrollment',
  ({ strapi }) => ({
    enroll: async (ctx, next) => {

        const userId = ctx.state.user.id;
        const uid = ctx.request.body.data.uid;

        const spaces = await strapi.entityService.findMany(
            "api::learning-space.learning-space",
            {
              filters: {
                uid: uid,
              },
            }
          );

          if (spaces.length === 0) {
            ctx.status = 504;
            ctx.body = { ok: false };
          } else {
            const space: any = spaces[0];
            const enrollment = await strapi.entityService.create('api::enrollment.enrollment', {
                data: {
                    users_permissions_user: userId,
                    learning_space: space.id
                }
            });
            ctx.status = 200;
            ctx.body = { ok: true };
          }

    }
}))
