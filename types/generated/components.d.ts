import type { Attribute, Schema } from '@strapi/strapi';

export interface SpacesContent extends Schema.Component {
  collectionName: 'components_spaces_contents';
  info: {
    displayName: 'Content';
  };
  attributes: {
    media: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    text: Attribute.RichText;
  };
}

export interface SpacesModule extends Schema.Component {
  collectionName: 'components_spaces_modules';
  info: {
    description: '';
    displayName: 'Module';
    icon: 'arrowDown';
  };
  attributes: {
    contents: Attribute.Component<'spaces.content', true>;
    moduleId: Attribute.String;
    moduleType: Attribute.Enumeration<['Content', 'Monitoring']> &
      Attribute.DefaultTo<'Content'>;
    name: Attribute.String;
    topics: Attribute.Component<'spaces.topic', true>;
    uploadFiles: Attribute.Boolean;
  };
}

export interface SpacesTopic extends Schema.Component {
  collectionName: 'components_spaces_topics';
  info: {
    description: '';
    displayName: 'Topic';
    icon: 'arrowRight';
  };
  attributes: {
    contents: Attribute.Component<'spaces.content', true>;
    name: Attribute.String;
    topicId: Attribute.String;
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
