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
            sort: { createdAt: 'desc' },
            filters: {
              parent: null,
              channel: ctx.params.id,
            },
            populate: ["users_permissions_user", "children", "children.users_permissions_user", "file", "children.file"],
          }
        );

        messages.forEach((message: any) => {
            message.userId = message.users_permissions_user.id;
            message.username = message.users_permissions_user.username;
            message.users_permissions_user = undefined;
            message.channelId = parseInt(ctx.params.id);
            message.children.forEach((child: any) => {
                child.userId = child.users_permissions_user.id;
                child.username = child.users_permissions_user.username;
                child.users_permissions_user = undefined;
            })

            message.children = _.orderBy(message.children, ['createdAt'], ['desc']);
        });

        // const contentType = strapi.contentType(
        //   "api::message.message"
        // );

        // const contentType2 = strapi.contentType(
        //     "plugin::users-permissions.permission"
        //   );

        // console.log('messages', messages)

        // const sanitizedResults0 = await sanitize.contentAPI.output(
        //     messages[0].users_permissions_user,
        //     contentType2,
        //   { auth: ctx.state.auth }
        // );

        // console.log('sanitizedResults0', sanitizedResults0)

        // const sanitizedResults = await sanitize.contentAPI.output(
        //     messages,
        //   contentType,
        //   { auth: ctx.state.auth }
        // );

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
