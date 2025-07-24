import type { Attribute, Schema } from '@strapi/strapi';

export interface ContentAccordion extends Schema.Component {
  collectionName: 'components_content_accordions';
  info: {
    description: '';
    displayName: 'Accordion';
  };
  attributes: {
    color: Attribute.Enumeration<['primary', 'secondary', 'tertiary', 'loop']>;
    items: Attribute.Component<'sub.accordion-item', true>;
  };
}

export interface ContentImage extends Schema.Component {
  collectionName: 'components_content_images';
  info: {
    description: '';
    displayName: 'Image';
  };
  attributes: {
    image: Attribute.Media<'images'>;
  };
}

export interface ContentQuiz extends Schema.Component {
  collectionName: 'components_content_quizzes';
  info: {
    displayName: 'Quiz';
  };
  attributes: {
    quiz: Attribute.Relation<'content.quiz', 'oneToOne', 'api::quiz.quiz'>;
  };
}

export interface ContentText extends Schema.Component {
  collectionName: 'components_content_texts';
  info: {
    displayName: 'Text';
  };
  attributes: {
    text: Attribute.Blocks;
    title: Attribute.String;
  };
}

export interface ContentVideo extends Schema.Component {
  collectionName: 'components_content_videos';
  info: {
    description: '';
    displayName: 'Video';
  };
  attributes: {
    thumbnail: Attribute.Media<'images'>;
    title: Attribute.String;
    transcript: Attribute.Media<'files'>;
    url: Attribute.String;
    video: Attribute.Media<'videos'>;
  };
}

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

export interface SubAccordionItem extends Schema.Component {
  collectionName: 'components_sub_accordion_items';
  info: {
    displayName: 'AccordionItem';
  };
  attributes: {
    text: Attribute.Blocks;
    title: Attribute.String;
  };
}

export interface SubQuizItem extends Schema.Component {
  collectionName: 'components_sub_quiz_items';
  info: {
    description: '';
    displayName: 'QuizItem';
  };
  attributes: {
    answer: Attribute.Text;
    options: Attribute.Component<'sub.quiz-question-item', true>;
    question: Attribute.String;
    title: Attribute.String;
  };
}

export interface SubQuizQuestionItem extends Schema.Component {
  collectionName: 'components_sub_quiz_question_items';
  info: {
    displayName: 'QuizQuestionItem';
  };
  attributes: {
    correct: Attribute.Boolean & Attribute.DefaultTo<false>;
    option: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'content.accordion': ContentAccordion;
      'content.image': ContentImage;
      'content.quiz': ContentQuiz;
      'content.text': ContentText;
      'content.video': ContentVideo;
      'spaces.content': SpacesContent;
      'spaces.module': SpacesModule;
      'spaces.topic': SpacesTopic;
      'sub.accordion-item': SubAccordionItem;
      'sub.quiz-item': SubQuizItem;
      'sub.quiz-question-item': SubQuizQuestionItem;
    }
  }
}
