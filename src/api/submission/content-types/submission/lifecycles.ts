export default {
  beforeCreate(event) {
    const ctx = strapi.requestContext.get();
    console.log("event.params.data", ctx);
    event.params.data.users_permissions_user = ctx.state.user.id;
  },
  async beforeDelete(event) {
    const id = event.params.where.id;
    const item = await strapi.entityService.findOne(event.model.uid, id, {
      populate: { users_permissions_user: true },
    });
    const ctx = strapi.requestContext.get();
    if (item.users_permissions_user.id !== ctx.state.user.id) {
      throw new Error("You are not allowed to delete this item");
    }
  },
};
