import { v4 as uuidv4 } from "uuid";

export default {
  beforeCreate(event) {    

    const ctx = strapi.requestContext.get()
    console.log('event.params.data', ctx);
    event.params.data.users_permissions_user = ctx.state.user.id;
  },
};
