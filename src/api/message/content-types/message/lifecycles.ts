import { errors } from "@strapi/utils";
import { canReadChannel, isSpaceManager } from "../../../../utils/access";
import { queueMessageNotifications } from "../../../../utils/notifications";

/**
 * The learner making the request through the site's API, or null for the Strapi admin panel and
 * internal calls (they are not restricted).
 */
const siteUser = () => {
  const ctx = strapi.requestContext.get();
  if (!ctx?.state?.user) return null;
  return ctx.state.auth?.strategy?.name === "users-permissions" ? ctx.state.user : null;
};

/** Channel id from the relation value sent by the site (id, {id}, or {connect: [...]}) */
const relationId = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return Number(value) || null;
  if (Array.isArray(value)) return relationId(value[0]);
  if (value.id) return Number(value.id);
  if (value.connect) return relationId(value.connect);
  return null;
};

/** The `data` of the current request body (JSON, or a string in multipart uploads). */
const requestData = () => {
  const data = strapi.requestContext.get()?.request?.body?.data;
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

const loadMessage = (id: number) =>
  strapi.entityService.findOne("api::message.message", id, {
    populate: {
      users_permissions_user: { fields: ["id"] },
      channel: { populate: { forum: { populate: { learning_space: { fields: ["uid"] } } } } },
    },
  });

const queue = async (id: number) => {
  try {
    await queueMessageNotifications(id);
  } catch (error) {
    strapi.log.error(`[notifications] could not queue message ${id}: ${error?.message || error}`);
  }
};

export default {
  async beforeCreate(event: any) {
    const user = siteUser();
    if (user) {
      event.params.data.users_permissions_user = user.id;

      // The API drops relations to types the role can't read through the generic endpoints
      // (messages, since 2026-10-26), so replies lost their parent. Take the relations from
      // the request itself.
      const raw = requestData();
      const channelId = relationId(event.params.data.channel) ?? relationId(raw?.channel);
      const parentId = relationId(event.params.data.parent) ?? relationId(raw?.parent);

      // Only learners with access to the channel's course may post in it.
      const channel: any = channelId
        ? await strapi.entityService.findOne("api::channel.channel", channelId, { fields: ["uid"] })
        : null;
      if (!channel || !(await canReadChannel(user, channel.uid))) {
        throw new errors.ForbiddenError("You can't write in this channel.");
      }
      event.params.data.channel = channel.id;

      // A reply must answer a message of the same conversation (channels share a uid across
      // languages).
      if (parentId) {
        const parent: any = await strapi.entityService.findOne("api::message.message", parentId, {
          populate: { channel: { fields: ["uid"] } },
        });
        if (!parent || parent.channel?.uid !== channel.uid) {
          throw new errors.ValidationError("The message you reply to is not in this channel.");
        }
        event.params.data.parent = parent.id;
      } else {
        event.params.data.parent = null;
      }
    }

    // Auto-generate message order based on creation time
    event.params.data.message_order = Date.now();
  },

  async afterCreate(event: any) {
    await queue(event.result.id);
  },

  async beforeUpdate(event: any) {
    const { data } = event.params;

    // Ensure message_order is not modified during updates
    if (data.message_order) {
      delete data.message_order;
    }

    const user = siteUser();
    if (user) {
      const message: any = await loadMessage(event.params.where.id);
      if (!message || message.users_permissions_user?.id !== user.id) {
        throw new errors.ForbiddenError("You can only edit your own messages.");
      }
      // Learners edit the text (and file) only.
      delete data.users_permissions_user;
      delete data.channel;
      delete data.parent;
      delete data.children;
    }
  },

  async afterUpdate(event: any) {
    // New mentions added by an edit are queued; removed ones are dropped at send time.
    await queue(event.result.id);
  },

  async beforeDelete(event: any) {
    const user = siteUser();
    if (!user) return;
    const message: any = await loadMessage(event.params.where.id);
    if (!message) return;
    const isAuthor = message.users_permissions_user?.id === user.id;
    const spaceUid = message.channel?.forum?.learning_space?.uid;
    if (!isAuthor && !(await isSpaceManager(user, spaceUid))) {
      throw new errors.ForbiddenError("You can only delete your own messages.");
    }
  },
};
