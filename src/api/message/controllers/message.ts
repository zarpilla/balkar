/**
 * message controller
 */

import { factories } from "@strapi/strapi";
import _ from "lodash";
// export default factories.createCoreController('api::message.message');

export default factories.createCoreController(
  "api::message.message",
  ({ strapi }) => ({
    findChildren: async (ctx, next) => {
      try {
        const message: any = await strapi.entityService.findOne(
          "api::message.message",
          ctx.params.id,
          {
            populate: [
              "users_permissions_user",
              "children",
              "children.users_permissions_user",
              "file",
              "children.file",
              "users_permissions_user.user_avatar",
              "users_permissions_user.user_avatar.avatar",
              "children.users_permissions_user.user_avatar",
              "children.users_permissions_user.user_avatar.avatar",
            ],
          }
        );

        message.userId = message.users_permissions_user.id;
        message.username = `${message.users_permissions_user.name} ${message.users_permissions_user.lastname}`;        
        message.channelId = parseInt(ctx.params.id);
        message.avatar = message.users_permissions_user.user_avatar ? message.users_permissions_user.user_avatar.avatar.url : null;
        message.users_permissions_user = undefined;
        message.children.forEach((child: any) => {
          child.userId = child.users_permissions_user.id;
          child.username = `${child.users_permissions_user.name} ${child.users_permissions_user.lastname}`;
          child.avatar = child.users_permissions_user.user_avatar ? child.users_permissions_user.user_avatar.avatar.url : null;
          child.users_permissions_user = undefined;          
        });

        message.children = _.orderBy(message.children, ["id"], ["asc"]);

        ctx.body = {
          data: message,
          meta: { children: message.children.length },
        };
      } catch (err) {
        ctx.body = err;
      }
    },
  })
);
