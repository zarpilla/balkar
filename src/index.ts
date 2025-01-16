import permisssionSetter from './bootstrap/set-permissions'
import { setMetaComponents } from './bootstrap/meta-components'

import { v4 as uuidv4 } from 'uuid';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    permisssionSetter().then(() => {
      console.log('permissions set')
    })
    setMetaComponents(strapi);
  },
};
