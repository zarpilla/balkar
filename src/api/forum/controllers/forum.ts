/**
 * forum controller
 */
import { factories } from "@strapi/strapi";
import { sanitize } from "@strapi/utils";
import _ from "lodash";

export default factories.createCoreController(
  "api::forum.forum",
  ({ strapi }) => ({
    findUid: async (ctx, next) => {
      const spaces = await strapi.entityService.findMany(
        "api::learning-space.learning-space",
        {
          filters: {
            uid: ctx.params.uid,
            publishedAt: { $ne: null },
          },
          populate: [
            "forum",
            "forum.channels",
            "forum.channels.users_permissions_users",
          ],
          locale: ctx.query.locale || "en",
        }
      );

      if (spaces.length === 0) {
        ctx.status = 504;
        ctx.body = { ok: false };
      } else {
        const space: any = spaces[0];

        if (!space.forum) {
          ctx.status = 504;
          ctx.body = { ok: false };
        }

        const channels = space.forum.channels
          .filter(
            (channel) =>
              channel.users_permissions_users.length === 0 ||
              (channel.users_permissions_users.length > 0 &&
                channel.users_permissions_users
                  .map((user) => user.id)
                  .includes(ctx.state.user.id))
          )
          // .filter((channel) => channel.publishedAt);

        channels.forEach((channel) => {
          channel.users_permissions_users = channel.users_permissions_users.map(
            (user) => {
              return {
                id: user.id,
                username: user.username,
                name: user.name,
                lastname: user.lastname,
              };
            }
          );
        });

        space.forum.channels = _.sortBy(channels, "order");

        const enrollments = await strapi.entityService.findMany(
          "api::enrollment.enrollment",
          {
            filters: {
              users_permissions_user: ctx.state.user.id,
              learning_space: space.id,
            },
            populate: [],
          }
        );

        if (!enrollments) {
          ctx.status = 504;
          ctx.body = { ok: false };
        } else {
          const forumEnrollments = await strapi.entityService.findMany(
            "api::enrollment.enrollment",
            {
              filters: {
                learning_space: space.id,
              },
              populate: ["users_permissions_user"],
            }
          );

          const users = _.uniqBy(
            forumEnrollments
              .filter((e) => e.users_permissions_user)
              .map((enrollment) => {
                return {
                  id: enrollment.users_permissions_user.id,
                  username: enrollment.users_permissions_user.username,
                  name: enrollment.users_permissions_user.name,
                  lastname: enrollment.users_permissions_user.lastname,
                  allowPrivateMessages:
                    enrollment.users_permissions_user.allowPrivateMessages,
                };
              }),
            "id"
          );

          // find the avatars of the users
          const avatars = await strapi.entityService.findMany(
            "api::user-avatar.user-avatar",
            {
              filters: {
                users_permissions_user: {
                  id: {
                    $in: users.map((user) => user.id),
                  },
                },
              },
              populate: ["avatar", "users_permissions_user"],
            }
          );

          users.forEach((user: any) => {
            const avatar = avatars.find(
              (avatar) => avatar.users_permissions_user.id === user.id
            );
            if (avatar && avatar.avatar && avatar.avatar.url) {
              user.avatar = avatar.avatar.url;
            }
          });

          // Get private channels for the current user
          const privateChannels = await strapi.entityService.findMany(
            "api::channel.channel",
            {
              filters: {
                forum: {
                  id: space.forum.id,
                },
                users_permissions_users: {
                  id: {
                    $in: [ctx.state.user.id],
                  },
                },
                publishedAt: { $ne: null },
              },
              populate: {
                users_permissions_users: {
                  fields: [
                    "id",
                    "username",
                    "name",
                    "lastname",
                    "allowPrivateMessages",
                  ],
                },
              },
            }
          );

          // Filter to get only channels that have exactly 2 users (private channels)
          // and where all users have allowPrivateMessages === true
          const userPrivateChannels = privateChannels
            .filter((channel: any) => {
              return (
                channel.users_permissions_users.length === 2 &&
                channel.users_permissions_users.every(
                  (user: any) => user.allowPrivateMessages === true
                )
              );
            })
            .map((channel: any) => {
              // Get the other user in the private channel
              const otherUser = channel.users_permissions_users.find(
                (user: any) => user.id !== ctx.state.user.id
              );

              // Find avatar for the other user
              const otherUserAvatar = avatars.find(
                (avatar) => avatar.users_permissions_user.id === otherUser.id
              );

              return {
                id: channel.id,
                name: channel.name,
                order: channel.order,
                createdAt: channel.createdAt,
                updatedAt: channel.updatedAt,
                publishedAt: channel.publishedAt,
                users_permissions_users: channel.users_permissions_users.map(
                  (user: any) => ({
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    lastname: user.lastname,
                  })
                ),
                other_user: {
                  id: otherUser.id,
                  username: otherUser.username,
                  name: otherUser.name,
                  lastname: otherUser.lastname,
                  avatar:
                    otherUserAvatar &&
                    otherUserAvatar.avatar &&
                    otherUserAvatar.avatar.url
                      ? otherUserAvatar.avatar.url
                      : null,
                },
              };
            });

          space.forum.users = users;
          space.forum.private_channels = userPrivateChannels;
          ctx.body = space.forum;
        }
      }
    },

    // Get unread message counts for a user across all forums
    /**
     * Get unread message counts for a user in a specific forum
     * Expects ctx.query.forumId
     */
    getUnreadCounts: async (ctx) => {
      const userId = ctx.state.user.id;
      const forumId = ctx.query.forumId;
      if (!forumId) {
        ctx.status = 400;
        ctx.body = { error: "forumId is required" };
        return;
      }
      try {
        // Get all channels in the forum the user has access to
        const channels = await strapi.entityService.findMany(
          "api::channel.channel",
          {
            populate: ["forum", "users_permissions_users"],
            filters: {
              forum: { id: forumId },
              users_permissions_users: { id: userId },
            },
          }
        );

        const unreadCounts = [];

        for (const channel of channels) {
          // Get user's last read position for this channel
          const lastReadArr = await strapi.entityService.findMany(
            "api::user-channel-read.user-channel-read",
            {
              filters: {
                user: userId,
                channel: { id: channel.id },
              },
              populate: ["last_read_message"],
            }
          );

          let unreadCount = 0;
          let lastReadOrder = 0;
          if (
            lastReadArr.length > 0 &&
            lastReadArr[0].last_read_message &&
            typeof lastReadArr[0].last_read_message.message_order === "number"
          ) {
            lastReadOrder = lastReadArr[0].last_read_message.message_order;
          }

          // Count messages after the last read message
          unreadCount = await strapi.entityService.count(
            "api::message.message",
            {
              filters: {
                channel: { id: channel.id },
                message_order: { $gt: lastReadOrder },
              },
            }
          );

          unreadCounts.push({
            channelId: channel.id,
            channelName: channel.name,
            forumId: channel.forum.id,
            forumName: channel.forum.name,
            unreadCount,
          });
        }

        ctx.body = { unreadCounts };
      } catch (error) {
        ctx.throw(500, error);
      }
    },

    // Mark channel as read up to a specific message
    markChannelAsRead: async (ctx) => {
      const userId = ctx.state.user.id;
      const { channelId, messageId } = ctx.request.body;

      try {
        // Get the message to verify it exists and get its order
        const message = await strapi.entityService.findOne(
          "api::message.message",
          messageId,
          {
            fields: ["message_order"],
          }
        );

        if (!message) {
          return ctx.throw(404, "Message not found");
        }

        // Check if user already has a read record for this channel
        const existingRead = await strapi.entityService.findMany(
          "api::user-channel-read.user-channel-read",
          {
            filters: {
              user: userId,
              channel: channelId,
            },
          }
        );

        if (existingRead.length > 0) {
          // Update existing record
          await strapi.entityService.update(
            "api::user-channel-read.user-channel-read",
            existingRead[0].id,
            {
              data: {
                last_read_message: messageId,
                last_read_at: new Date(),
              },
            }
          );
        } else {
          // Create new record
          await strapi.entityService.create(
            "api::user-channel-read.user-channel-read",
            {
              data: {
                user: userId,
                channel: channelId,
                last_read_message: messageId,
                last_read_at: new Date(),
              },
            }
          );
        }

        ctx.body = { success: true };
      } catch (error) {
        ctx.throw(500, error);
      }
    },

    // Mark entire channel as read (marks the latest message as read)
    markChannelAsReadAll: async (ctx) => {
      const userId = ctx.state.user.id;
      const { channelId } = ctx.request.body;

      try {
        // Get the latest message in the channel
        const latestMessage = await strapi.entityService.findMany(
          "api::message.message",
          {
            filters: {
              channel: channelId,
            },
            sort: { message_order: "desc" },
            limit: 1,
          }
        );

        if (latestMessage.length === 0) {
          return ctx.throw(404, "No messages found in channel");
        }

        const messageId = latestMessage[0].id;

        // Check if user already has a read record for this channel
        const existingRead = await strapi.entityService.findMany(
          "api::user-channel-read.user-channel-read",
          {
            filters: {
              user: userId,
              channel: channelId,
            },
          }
        );

        if (existingRead.length > 0) {
          // Update existing record
          await strapi.entityService.update(
            "api::user-channel-read.user-channel-read",
            existingRead[0].id,
            {
              data: {
                last_read_message: messageId,
                last_read_at: new Date(),
              },
            }
          );
        } else {
          // Create new record
          await strapi.entityService.create(
            "api::user-channel-read.user-channel-read",
            {
              data: {
                user: userId,
                channel: channelId,
                last_read_message: messageId,
                last_read_at: new Date(),
              },
            }
          );
        }

        ctx.body = { success: true };
      } catch (error) {
        ctx.throw(500, error);
      }
    },
  })
);
