/**
 * user-channel-read controller
 */
import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::user-channel-read.user-channel-read",
  ({ strapi }) => ({
    // Get user's read status for a specific channel
    getChannelReadStatus: async (ctx) => {
      const userId = ctx.state.user.id;
      const { channelId } = ctx.params;

      try {
        const readStatus = await strapi.entityService.findMany('api::user-channel-read.user-channel-read', {
          filters: {
            user: userId,
            channel: channelId
          },
          populate: ['last_read_message']
        });

        if (readStatus.length === 0) {
          ctx.body = {
            hasRead: false,
            lastReadMessage: null,
            lastReadAt: null
          };
        } else {
          ctx.body = {
            hasRead: true,
            lastReadMessage: readStatus[0].last_read_message,
            lastReadAt: readStatus[0].last_read_at
          };
        }
      } catch (error) {
        ctx.throw(500, error);
      }
    },

    // Get all read statuses for a user
    getUserReadStatuses: async (ctx) => {
      const userId = ctx.state.user.id;

      try {
        const readStatuses = await strapi.entityService.findMany('api::user-channel-read.user-channel-read', {
          filters: {
            user: userId
          },
          populate: ['channel', 'last_read_message']
        });

        ctx.body = { readStatuses };
      } catch (error) {
        ctx.throw(500, error);
      }
    }
  })
);
