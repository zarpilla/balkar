'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::forum.forum', ({ strapi }) => ({
  // Get unread message counts for a user across all forums
  async getUnreadCounts(ctx) {
    const userId = ctx.state.user.id;
    
    try {
      // Get all channels the user has access to
      const channels = await strapi.entityService.findMany('api::channel.channel', {
        populate: ['forum', 'users_permissions_users'],
        filters: {
          users_permissions_users: {
            id: userId
          }
        }
      });

      const unreadCounts = [];

      for (const channel of channels) {
        // Get user's last read position for this channel
        const lastRead = await strapi.entityService.findMany('api::user-channel-read.user-channel-read', {
          filters: {
            user: userId,
            channel: channel.id
          },
          populate: ['last_read_message']
        });

        let unreadCount = 0;
        
        if (lastRead.length > 0) {
          // Count messages after the last read message
          const lastReadOrder = lastRead[0].last_read_message?.message_order || 0;
          
          const messagesCount = await strapi.entityService.count('api::message.message', {
            filters: {
              channel: channel.id,
              message_order: {
                $gt: lastReadOrder
              }
            }
          });
          
          unreadCount = messagesCount;
        } else {
          // User has never read this channel, count all messages
          unreadCount = await strapi.entityService.count('api::message.message', {
            filters: {
              channel: channel.id
            }
          });
        }

        unreadCounts.push({
          channelId: channel.id,
          channelName: channel.name,
          forumId: channel.forum.id,
          forumName: channel.forum.name,
          unreadCount
        });
      }

      ctx.body = { unreadCounts };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  // Mark channel as read up to a specific message
  async markChannelAsRead(ctx) {
    const userId = ctx.state.user.id;
    const { channelId, messageId } = ctx.request.body;

    try {
      // Get the message to verify it exists and get its order
      const message = await strapi.entityService.findOne('api::message.message', messageId, {
        fields: ['message_order']
      });

      if (!message) {
        return ctx.throw(404, 'Message not found');
      }

      // Check if user already has a read record for this channel
      const existingRead = await strapi.entityService.findMany('api::user-channel-read.user-channel-read', {
        filters: {
          user: userId,
          channel: channelId
        }
      });

      if (existingRead.length > 0) {
        // Update existing record
        await strapi.entityService.update('api::user-channel-read.user-channel-read', existingRead[0].id, {
          data: {
            last_read_message: messageId,
            last_read_at: new Date()
          }
        });
      } else {
        // Create new record
        await strapi.entityService.create('api::user-channel-read.user-channel-read', {
          data: {
            user: userId,
            channel: channelId,
            last_read_message: messageId,
            last_read_at: new Date()
          }
        });
      }

      ctx.body = { success: true };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  // Mark entire channel as read (marks the latest message as read)
  async markChannelAsReadAll(ctx) {
    const userId = ctx.state.user.id;
    const { channelId } = ctx.request.body;

    try {
      // Get the latest message in the channel
      const latestMessage = await strapi.entityService.findMany('api::message.message', {
        filters: {
          channel: channelId
        },
        sort: { message_order: 'desc' },
        limit: 1
      });

      if (latestMessage.length === 0) {
        return ctx.throw(404, 'No messages found in channel');
      }

      const messageId = latestMessage[0].id;

      // Check if user already has a read record for this channel
      const existingRead = await strapi.entityService.findMany('api::user-channel-read.user-channel-read', {
        filters: {
          user: userId,
          channel: channelId
        }
      });

      if (existingRead.length > 0) {
        // Update existing record
        await strapi.entityService.update('api::user-channel-read.user-channel-read', existingRead[0].id, {
          data: {
            last_read_message: messageId,
            last_read_at: new Date()
          }
        });
      } else {
        // Create new record
        await strapi.entityService.create('api::user-channel-read.user-channel-read', {
          data: {
            user: userId,
            channel: channelId,
            last_read_message: messageId,
            last_read_at: new Date()
          }
        });
      }

      ctx.body = { success: true };
    } catch (error) {
      ctx.throw(500, error);
    }
  }
}));
