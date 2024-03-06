/**
 * channel controller
 */

import { factories } from "@strapi/strapi";
import { sanitize } from "@strapi/utils";
import _ from "lodash";

export default factories.createCoreController(
  "api::channel.channel",
  ({ strapi }) => ({
    findMessages: async (ctx, next) => {
      try {
        const messages = await strapi.entityService.findMany(
          "api::message.message",
          {
            limit: ctx.query._limit || 5,
            start: ctx.query._start || 0,
            sort: { createdAt: "desc" },
            filters: {
              parent: null,
              channel: ctx.params.id,
            },
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

        messages.forEach((message: any) => {
          message.userId = message.users_permissions_user.id;
          message.username = `${message.users_permissions_user.name} ${message.users_permissions_user.lastname}`;
          message.avatar = message.users_permissions_user.user_avatar ? message.users_permissions_user.user_avatar.avatar.url : null;
          message.users_permissions_user = undefined;
          message.channelId = parseInt(ctx.params.id);
          message.children.forEach((child: any) => {
            child.userId = child.users_permissions_user.id;
            child.username = `${child.users_permissions_user.name} ${child.users_permissions_user.lastname}`;
            child.avatar = child.users_permissions_user.user_avatar ? child.users_permissions_user.user_avatar.avatar.url : null;
            child.users_permissions_user = undefined;
          });

          message.children = _.orderBy(message.children, ["id"], ["asc"]);
        });

        ctx.body = {
          data: messages,
          meta: { total: messages.length },
        };
      } catch (err) {
        ctx.body = err;
      }
    },
  })
);
