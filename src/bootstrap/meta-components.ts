// const strapi = require('@strapi/strapi')
const { v4: uuidv4 } = require('uuid');

export function setMetaComponents(strapi) {
  const _metadata: Map<any, any> = strapi.db.metadata;
  _metadata.set("spaces.module", {
    ..._metadata.get("spaces.module"),
    lifecycles: {
      beforeCreate: async (e: any) => {       
        if (!e.params.data.moduleId) {
          e.params.data.moduleId = uuidv4();
        }
      },
      beforeUpdate: async (e: any) => {       
        if (!e.params.data.moduleId) {
          e.params.data.moduleId = uuidv4();
        }
      },
    },
  });
  _metadata.set("spaces.topic", {
    ..._metadata.get("spaces.topic"),
    lifecycles: {
      beforeCreate: async (e: any) => {
        if (!e.params.data.topicId) {
          e.params.data.topicId = uuidv4();
        }
      },
      beforeUpdate: async (e: any) => {
        if (!e.params.data.topicId) {
          e.params.data.topicId = uuidv4();
        }
      },
    },
  });
}
