import type { Schema, Attribute } from '@strapi/strapi';

export interface SpacesModule extends Schema.Component {
  collectionName: 'components_spaces_modules';
  info: {
    displayName: 'Module';
    icon: 'arrowDown';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    topics: Attribute.Component<'spaces.topic', true>;
    moduleType: Attribute.Enumeration<['Content', 'Monitoring']> &
      Attribute.DefaultTo<'Content'>;
  };
}

export interface SpacesTopic extends Schema.Component {
  collectionName: 'components_spaces_topics';
  info: {
    displayName: 'Topic';
    icon: 'arrowRight';
  };
  attributes: {
    name: Attribute.String;
    content: Attribute.Blocks;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'spaces.module': SpacesModule;
      'spaces.topic': SpacesTopic;
    }
  }
}
