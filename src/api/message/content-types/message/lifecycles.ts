import { v4 as uuidv4 } from "uuid";

export default {
  beforeCreate(event: any) {
    const ctx = strapi.requestContext.get();
    if (ctx) {
      event.params.data.users_permissions_user = ctx.state.user.id;
    }
    
    // Auto-generate message order based on creation time
    event.params.data.message_order = Date.now();
  },

  beforeUpdate(event: any) {
    const { data } = event.params;
    
    // Ensure message_order is not modified during updates
    if (data.message_order) {
      delete data.message_order;
    }
  }
};
