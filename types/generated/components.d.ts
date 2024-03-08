import type { Schema, Attribute } from '@strapi/strapi';

export interface SpacesContent extends Schema.Component {
  collectionName: 'components_spaces_contents';
  info: {
    displayName: 'Content';
  };
  attributes: {
    text: Attribute.RichText;
    media: Attribute.Media;
  };
}

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
    uploadFiles: Attribute.Boolean;
    contents: Attribute.Component<'spaces.content', true>;
  };
}

export interface SpacesTopic extends Schema.Component {
  collectionName: 'components_spaces_topics';
  info: {
    displayName: 'Topic';
    icon: 'arrowRight';
    description: '';
  };
  attributes: {
    name: Attribute.String;
    contents: Attribute.Component<'spaces.content', true>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'spaces.content': SpacesContent;
      'spaces.module': SpacesModule;
      'spaces.topic': SpacesTopic;
    }
  }
}
