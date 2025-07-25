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
          message.avatar = message.users_permissions_user.user_avatar
            ? message.users_permissions_user.user_avatar.avatar.url
            : null;
          message.users_permissions_user = undefined;
          message.channelId = parseInt(ctx.params.id);
          message.children.forEach((child: any) => {
            child.userId = child.users_permissions_user.id;
            child.username = `${child.users_permissions_user.name} ${child.users_permissions_user.lastname}`;
            child.avatar = child.users_permissions_user.user_avatar
              ? child.users_permissions_user.user_avatar.avatar.url
              : null;
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

    findUserMessages: async (ctx, next) => {
      const forumId = ctx.params.forumid;
      const userId = ctx.params.userid;

      const entries = await strapi.db.query("api::channel.channel").findMany({
        where: {
          title: {
            $contains: "Hello",
          },
        },
      });

      const userChannels = await strapi.entityService.findMany(
        "api::channel.channel",
        {
          filters: {
            $and: [
              {
                forum: {
                  learning_space: {
                    uid: forumId,
                  },
                },
              },
              ,
              {
                users_permissions_users: {
                  id: {
                    $in: [userId],
                  },
                },
              },
              {
                users_permissions_users: {
                  id: {
                    $in: [ctx.user.id],
                  },
                },
              },
            ],
          },

          populate: ["users_permissions_users"],
        }
      );
    },

    createPrivateChannel: async (ctx, next) => {
      try {
        const { uid, userId } = ctx.request.body;
        const currentUserId = ctx.state.user.id;

        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              uid: uid,
              publishedAt: { $ne: null },
            },
            populate: ["forum"],
          }
        );
        
        if (spaces.length === 0 || !spaces[0].forum) {
          ctx.status = 404;
          ctx.body = { 
            ok: false, 
            error: "Forum not found" 
          };
          return;
        }

        const forum = spaces[0].forum;

        if (!forum.id || !userId) {
          ctx.status = 400;
          ctx.body = { 
            ok: false, 
            error: "forumId and userId are required" 
          };
          return;
        }

        if (userId === currentUserId) {
          ctx.status = 400;
          ctx.body = { 
            ok: false, 
            error: "Cannot create private channel with yourself" 
          };
          return;
        }

        // Find the forum by learning space uid
        // const spaces = await strapi.entityService.findMany(
        //   "api::learning-space.learning-space",
        //   {
        //     filters: {
        //       uid: forumId,
        //       publishedAt: { $ne: null },
        //     },
        //     populate: ["forum"],
        //   }
        // );


        // Check if both users are enrolled in the learning space
        const enrollments = await strapi.entityService.findMany(
          "api::enrollment.enrollment",
          {
            filters: {
              users_permissions_user: {
                id: {
                  $in: [currentUserId, userId],
                },
              },
              learning_space: {
                id: spaces[0].id,
              },
            },
            populate: ["users_permissions_user"],
          }
        );

        if (enrollments.length !== 2) {
          ctx.status = 403;
          ctx.body = { 
            ok: false, 
            error: "Both users must be enrolled in the learning space" 
          };
          return;
        }

        // Check if a private channel already exists between these two users
        const existingChannels = await strapi.entityService.findMany(
          "api::channel.channel",
          {
            filters: {
              forum: {
                id: forum.id,
              },
              users_permissions_users: {
                id: {
                  $in: [currentUserId, userId],
                },
              },
            },
            populate: ["users_permissions_users"],
          }
        );

        // Filter to find channels that contain exactly these two users
        const privateChannel = existingChannels.find((channel: any) => {
          const userIds = channel.users_permissions_users.map((user: any) => user.id);
          return (
            userIds.length === 2 &&
            userIds.includes(currentUserId) &&
            userIds.includes(userId)
          );
        });

        if (privateChannel) {
          ctx.status = 200;
          ctx.body = {
            ok: true,
            data: privateChannel,
            message: "Private channel already exists",
          };
          return;
        }

        // Get user information for channel name
        const users = await strapi.entityService.findMany(
          "plugin::users-permissions.user",
          {
            filters: {
              id: {
                $in: [currentUserId, userId],
              },
            },
          }
        );

        const currentUser = users.find((user) => user.id === currentUserId);
        const targetUser = users.find((user) => user.id === userId);

        // Create new private channel
        const newChannel = await strapi.entityService.create(
          "api::channel.channel",
          {
            data: {
              name: `${currentUser.name} & ${targetUser.name}`,
              forum: forum.id,
              users_permissions_users: [currentUserId, userId],
              publishedAt: new Date(),
              order: 999, // Place private channels at the end
            },
            populate: ["users_permissions_users"],
          }
        );

        ctx.status = 201;
        ctx.body = {
          ok: true,
          data: newChannel,
          message: "Private channel created successfully",
        };
      } catch (err) {
        console.error("Error creating private channel:", err);
        ctx.status = 500;
        ctx.body = { 
          ok: false, 
          error: "Internal server error" 
        };
      }
    },
  })
);
