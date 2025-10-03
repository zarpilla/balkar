import type { Attribute, Schema } from '@strapi/strapi';

export interface AdminApiToken extends Schema.CollectionType {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::api-token',
      'oneToMany',
      'admin::api-token-permission'
    >;
    type: Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Attribute.Required &
      Attribute.DefaultTo<'read-only'>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::api-token-permission',
      'manyToOne',
      'admin::api-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::api-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminPermission extends Schema.CollectionType {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Attribute.JSON & Attribute.DefaultTo<{}>;
    conditions: Attribute.JSON & Attribute.DefaultTo<[]>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    properties: Attribute.JSON & Attribute.DefaultTo<{}>;
    role: Attribute.Relation<'admin::permission', 'manyToOne', 'admin::role'>;
    subject: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminRole extends Schema.CollectionType {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::role',
      'oneToMany',
      'admin::permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::role', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    users: Attribute.Relation<'admin::role', 'manyToMany', 'admin::user'>;
  };
}

export interface AdminTransferToken extends Schema.CollectionType {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Attribute.DefaultTo<''>;
    expiresAt: Attribute.DateTime;
    lastUsedAt: Attribute.DateTime;
    lifespan: Attribute.BigInteger;
    name: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Attribute.Relation<
      'admin::transfer-token',
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Schema.CollectionType {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    token: Attribute.Relation<
      'admin::transfer-token-permission',
      'manyToOne',
      'admin::transfer-token'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'admin::transfer-token-permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface AdminUser extends Schema.CollectionType {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Attribute.Boolean & Attribute.Private & Attribute.DefaultTo<false>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.Private &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Attribute.Boolean &
      Attribute.Private &
      Attribute.DefaultTo<false>;
    lastname: Attribute.String &
      Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Attribute.String;
    registrationToken: Attribute.String & Attribute.Private;
    resetPasswordToken: Attribute.String & Attribute.Private;
    roles: Attribute.Relation<'admin::user', 'manyToMany', 'admin::role'> &
      Attribute.Private;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'admin::user', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    username: Attribute.String;
  };
}

export interface ApiAdministrationAdministration extends Schema.SingleType {
  collectionName: 'administrations';
  info: {
    description: '';
    displayName: 'administration';
    pluralName: 'administrations';
    singularName: 'administration';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::administration.administration',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    logo: Attribute.Media<'images'>;
    paymentEmails: Attribute.String;
    resetPasswordFrontUrl: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::administration.administration',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiBookmarkBookmark extends Schema.CollectionType {
  collectionName: 'bookmarks';
  info: {
    description: '';
    displayName: 'Bookmark';
    pluralName: 'bookmarks';
    singularName: 'bookmark';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::bookmark.bookmark',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    learning_space: Attribute.Relation<
      'api::bookmark.bookmark',
      'oneToOne',
      'api::learning-space.learning-space'
    >;
    lesson: Attribute.Relation<
      'api::bookmark.bookmark',
      'oneToOne',
      'api::lesson.lesson'
    >;
    module: Attribute.Relation<
      'api::bookmark.bookmark',
      'oneToOne',
      'api::module.module'
    >;
    unit: Attribute.Relation<
      'api::bookmark.bookmark',
      'oneToOne',
      'api::unit.unit'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::bookmark.bookmark',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users_permissions_user: Attribute.Relation<
      'api::bookmark.bookmark',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiCertificatePaymentCertificatePayment
  extends Schema.CollectionType {
  collectionName: 'certificate_payments';
  info: {
    displayName: 'CertificatePayment';
    pluralName: 'certificate-payments';
    singularName: 'certificate-payment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::certificate-payment.certificate-payment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.String;
    lastname: Attribute.String;
    name: Attribute.String;
    payment: Attribute.Boolean;
    uid: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::certificate-payment.certificate-payment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiCertificateCertificate extends Schema.CollectionType {
  collectionName: 'certificates';
  info: {
    description: '';
    displayName: 'Certificate';
    pluralName: 'certificates';
    singularName: 'certificate';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    background: Attribute.Media<'images'>;
    color: Attribute.String;
    course: Attribute.Boolean;
    course_align: Attribute.Enumeration<['left', 'center', 'right']>;
    course_font: Attribute.Enumeration<['font1', 'font2']>;
    course_fontsize: Attribute.Integer;
    course_x: Attribute.Integer;
    course_y: Attribute.Integer;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::certificate.certificate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    date_align: Attribute.Enumeration<['left', 'center', 'right']>;
    date_font: Attribute.Enumeration<['font1', 'font2']>;
    date_fontsize: Attribute.Integer;
    date_x: Attribute.Integer;
    date_y: Attribute.Integer;
    hours: Attribute.String;
    hours_align: Attribute.Enumeration<['left', 'center', 'right']>;
    hours_font: Attribute.Enumeration<['font1', 'font2']>;
    hours_fontsize: Attribute.Integer;
    hours_x: Attribute.Integer;
    hours_y: Attribute.Integer;
    name: Attribute.String;
    to_align: Attribute.Enumeration<['left', 'center', 'right']>;
    to_font: Attribute.Enumeration<['font1', 'font2']>;
    to_fontsize: Attribute.Integer;
    to_x: Attribute.Integer;
    to_y: Attribute.Integer;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::certificate.certificate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiChannelChannel extends Schema.CollectionType {
  collectionName: 'channels';
  info: {
    description: '';
    displayName: 'Channel';
    pluralName: 'channels';
    singularName: 'channel';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::channel.channel',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    forum: Attribute.Relation<
      'api::channel.channel',
      'manyToOne',
      'api::forum.forum'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::channel.channel',
      'oneToMany',
      'api::channel.channel'
    >;
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    order: Attribute.Integer &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    uid: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::channel.channel',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users_permissions_users: Attribute.Relation<
      'api::channel.channel',
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
  };
}

export interface ApiEmailTemplateEmailTemplate extends Schema.CollectionType {
  collectionName: 'email_templates';
  info: {
    displayName: 'Email Template';
    pluralName: 'email-templates';
    singularName: 'email-template';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    content: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::email-template.email-template',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::email-template.email-template',
      'oneToMany',
      'api::email-template.email-template'
    >;
    subject: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    type: Attribute.Enumeration<['email_confirmation', 'reset_password']> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::email-template.email-template',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiEnrollmentEnrollment extends Schema.CollectionType {
  collectionName: 'enrollments';
  info: {
    description: '';
    displayName: 'Enrollment';
    pluralName: 'enrollments';
    singularName: 'enrollment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::enrollment.enrollment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    date: Attribute.DateTime;
    learning_space: Attribute.Relation<
      'api::enrollment.enrollment',
      'oneToOne',
      'api::learning-space.learning-space'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::enrollment.enrollment',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users_permissions_user: Attribute.Relation<
      'api::enrollment.enrollment',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiForumForum extends Schema.CollectionType {
  collectionName: 'forums';
  info: {
    description: '';
    displayName: 'Forum';
    pluralName: 'forums';
    singularName: 'forum';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    channels: Attribute.Relation<
      'api::forum.forum',
      'oneToMany',
      'api::channel.channel'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::forum.forum',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.RichText &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    learning_space: Attribute.Relation<
      'api::forum.forum',
      'oneToOne',
      'api::learning-space.learning-space'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::forum.forum',
      'oneToMany',
      'api::forum.forum'
    >;
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    uid: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::forum.forum',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiInterestInterest extends Schema.CollectionType {
  collectionName: 'interests';
  info: {
    description: '';
    displayName: 'Interest';
    pluralName: 'interests';
    singularName: 'interest';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::interest.interest',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name_ca: Attribute.String;
    name_en: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::interest.interest',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiLearningSpaceLearningSpace extends Schema.CollectionType {
  collectionName: 'learning_spaces';
  info: {
    description: '';
    displayName: 'Learning space';
    pluralName: 'learning-spaces';
    singularName: 'learning-space';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    banner: Attribute.Media<'images' | 'files' | 'videos' | 'audios'> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    bannerIntro: Attribute.Media<'images'> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    bannerOther: Attribute.Media<'images'> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    certificate: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToOne',
      'api::certificate.certificate'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    certificateLesson: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToOne',
      'api::lesson.lesson'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    certificateProduct: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToOne',
      'api::product.product'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    content_modules: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToMany',
      'api::module.module'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    enrollmentEmails: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    forum: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToOne',
      'api::forum.forum'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    free: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    global: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }> &
      Attribute.DefaultTo<false>;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToMany',
      'api::learning-space.learning-space'
    >;
    modules: Attribute.Component<'spaces.module', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    nameMore: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    privateDescription: Attribute.RichText &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    product: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToOne',
      'api::product.product'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    public: Attribute.Boolean &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    publicDescription: Attribute.RichText &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    publicLesson: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToOne',
      'api::lesson.lesson'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    publishedAt: Attribute.DateTime;
    uid: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::learning-space.learning-space',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users: Attribute.Relation<
      'api::learning-space.learning-space',
      'manyToMany',
      'plugin::users-permissions.user'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
  };
}

export interface ApiLessonLesson extends Schema.CollectionType {
  collectionName: 'lessons';
  info: {
    description: '';
    displayName: 'Lesson';
    pluralName: 'lessons';
    singularName: 'lesson';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    content: Attribute.DynamicZone<
      [
        'content.text',
        'content.image',
        'content.video',
        'content.accordion',
        'content.quiz',
        'content.slider'
      ]
    > &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::lesson.lesson',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::lesson.lesson',
      'oneToMany',
      'api::lesson.lesson'
    >;
    publishedAt: Attribute.DateTime;
    shortTitle: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    uid: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    unit: Attribute.Relation<
      'api::lesson.lesson',
      'manyToOne',
      'api::unit.unit'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::lesson.lesson',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMentionMention extends Schema.CollectionType {
  collectionName: 'mentions';
  info: {
    displayName: 'Mention';
    pluralName: 'mentions';
    singularName: 'mention';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::mention.mention',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    from: Attribute.Relation<
      'api::mention.mention',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    message: Attribute.Relation<
      'api::mention.mention',
      'oneToOne',
      'api::message.message'
    >;
    to: Attribute.Relation<
      'api::mention.mention',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::mention.mention',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiMessageMessage extends Schema.CollectionType {
  collectionName: 'messages';
  info: {
    description: '';
    displayName: 'Message';
    pluralName: 'messages';
    singularName: 'message';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    channel: Attribute.Relation<
      'api::message.message',
      'oneToOne',
      'api::channel.channel'
    >;
    children: Attribute.Relation<
      'api::message.message',
      'oneToMany',
      'api::message.message'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::message.message',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    file: Attribute.Media<'images' | 'videos' | 'audios' | 'files'>;
    message_order: Attribute.BigInteger;
    parent: Attribute.Relation<
      'api::message.message',
      'manyToOne',
      'api::message.message'
    >;
    text: Attribute.RichText;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::message.message',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users_permissions_user: Attribute.Relation<
      'api::message.message',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiModuleModule extends Schema.CollectionType {
  collectionName: 'modules';
  info: {
    description: '';
    displayName: 'Module';
    pluralName: 'modules';
    singularName: 'module';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    content: Attribute.DynamicZone<
      ['content.text', 'content.image', 'content.video']
    > &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::module.module',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    learning_space: Attribute.Relation<
      'api::module.module',
      'manyToOne',
      'api::learning-space.learning-space'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::module.module',
      'oneToMany',
      'api::module.module'
    >;
    menuTitle: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    publishedAt: Attribute.DateTime;
    shortTitle: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    uid: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
        translate: {
          translate: 'copy';
        };
      }>;
    units: Attribute.Relation<
      'api::module.module',
      'oneToMany',
      'api::unit.unit'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::module.module',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPaymentIntentPaymentIntent extends Schema.CollectionType {
  collectionName: 'payment_intents';
  info: {
    description: '';
    displayName: 'PaymentIntent';
    pluralName: 'payment-intents';
    singularName: 'payment-intent';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::payment-intent.payment-intent',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    data: Attribute.Text;
    name: Attribute.String;
    state: Attribute.Enumeration<['received', 'handled', 'intent', 'error']>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::payment-intent.payment-intent',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiPreEnrollementPreEnrollement extends Schema.CollectionType {
  collectionName: 'pre_enrollements';
  info: {
    description: '';
    displayName: 'PreEnrollement';
    pluralName: 'pre-enrollements';
    singularName: 'pre-enrollement';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::pre-enrollement.pre-enrollement',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.String;
    lastname: Attribute.String;
    name: Attribute.String;
    payment: Attribute.Boolean;
    uid: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::pre-enrollement.pre-enrollement',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProductProduct extends Schema.CollectionType {
  collectionName: 'products';
  info: {
    description: '';
    displayName: 'Product';
    pluralName: 'products';
    singularName: 'product';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::product.product',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.Text;
    image: Attribute.Media<'images'>;
    name: Attribute.String;
    paymentEmails: Attribute.String;
    price: Attribute.Decimal;
    publishedAt: Attribute.DateTime;
    stripePriceId: Attribute.String;
    stripeProductId: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::product.product',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiProgressProgress extends Schema.CollectionType {
  collectionName: 'progresses';
  info: {
    description: '';
    displayName: 'Progress';
    pluralName: 'progresses';
    singularName: 'progress';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::progress.progress',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    learning_space: Attribute.Relation<
      'api::progress.progress',
      'oneToOne',
      'api::learning-space.learning-space'
    >;
    lesson: Attribute.Relation<
      'api::progress.progress',
      'oneToOne',
      'api::lesson.lesson'
    >;
    module: Attribute.Relation<
      'api::progress.progress',
      'oneToOne',
      'api::module.module'
    >;
    moduleId: Attribute.String;
    topicId: Attribute.String;
    unit: Attribute.Relation<
      'api::progress.progress',
      'oneToOne',
      'api::unit.unit'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::progress.progress',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users_permissions_user: Attribute.Relation<
      'api::progress.progress',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiQuizQuiz extends Schema.CollectionType {
  collectionName: 'quizzes';
  info: {
    description: '';
    displayName: 'Quiz';
    pluralName: 'quizzes';
    singularName: 'quiz';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::quiz.quiz', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    introduction: Attribute.Blocks &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::quiz.quiz',
      'oneToMany',
      'api::quiz.quiz'
    >;
    publishedAt: Attribute.DateTime;
    questions: Attribute.Component<'sub.quiz-item', true> &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    uid: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::quiz.quiz', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiSpaceManagerSpaceManager extends Schema.CollectionType {
  collectionName: 'space_managers';
  info: {
    displayName: 'SpaceManager';
    pluralName: 'space-managers';
    singularName: 'space-manager';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::space-manager.space-manager',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    learning_space: Attribute.Relation<
      'api::space-manager.space-manager',
      'oneToOne',
      'api::learning-space.learning-space'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::space-manager.space-manager',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    user: Attribute.Relation<
      'api::space-manager.space-manager',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiSubmissionSubmission extends Schema.CollectionType {
  collectionName: 'submissions';
  info: {
    displayName: 'Submission';
    pluralName: 'submissions';
    singularName: 'submission';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::submission.submission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    file: Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>;
    learning_space: Attribute.Relation<
      'api::submission.submission',
      'oneToOne',
      'api::learning-space.learning-space'
    >;
    moduleId: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::submission.submission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users_permissions_user: Attribute.Relation<
      'api::submission.submission',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiSubtitleSubtitle extends Schema.CollectionType {
  collectionName: 'subtitles';
  info: {
    description: '';
    displayName: 'Subtitle';
    pluralName: 'subtitles';
    singularName: 'subtitle';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::subtitle.subtitle',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::subtitle.subtitle',
      'oneToMany',
      'api::subtitle.subtitle'
    >;
    name: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    text: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    transcript: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::subtitle.subtitle',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiTranslationTranslation extends Schema.CollectionType {
  collectionName: 'translations';
  info: {
    description: '';
    displayName: 'Translation';
    pluralName: 'translations';
    singularName: 'translation';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::translation.translation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    key: Attribute.UID;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::translation.translation',
      'oneToMany',
      'api::translation.translation'
    >;
    text: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    textHtml: Attribute.RichText &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::translation.translation',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface ApiUnitUnit extends Schema.CollectionType {
  collectionName: 'units';
  info: {
    description: '';
    displayName: 'Unit';
    pluralName: 'units';
    singularName: 'unit';
  };
  options: {
    draftAndPublish: true;
  };
  pluginOptions: {
    i18n: {
      localized: true;
    };
  };
  attributes: {
    content: Attribute.DynamicZone<
      [
        'content.video',
        'content.text',
        'content.image',
        'content.accordion',
        'content.quiz',
        'content.slider'
      ]
    > &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<'api::unit.unit', 'oneToOne', 'admin::user'> &
      Attribute.Private;
    lessons: Attribute.Relation<
      'api::unit.unit',
      'oneToMany',
      'api::lesson.lesson'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    locale: Attribute.String;
    localizations: Attribute.Relation<
      'api::unit.unit',
      'oneToMany',
      'api::unit.unit'
    >;
    menuTitle: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    module: Attribute.Relation<
      'api::unit.unit',
      'manyToOne',
      'api::module.module'
    > &
      Attribute.SetPluginOptions<{
        translate: {
          translate: 'translate';
        };
      }>;
    publishedAt: Attribute.DateTime;
    shortTitle: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
        translate: {
          translate: 'translate';
        };
      }>;
    uid: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: false;
        };
      }>;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<'api::unit.unit', 'oneToOne', 'admin::user'> &
      Attribute.Private;
  };
}

export interface ApiUserAvatarUserAvatar extends Schema.CollectionType {
  collectionName: 'user_avatars';
  info: {
    description: '';
    displayName: 'UserAvatar';
    pluralName: 'user-avatars';
    singularName: 'user-avatar';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    avatar: Attribute.Media<'images'>;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::user-avatar.user-avatar',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::user-avatar.user-avatar',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users_permissions_user: Attribute.Relation<
      'api::user-avatar.user-avatar',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiUserCertificateUserCertificate
  extends Schema.CollectionType {
  collectionName: 'user_certificates';
  info: {
    description: '';
    displayName: 'UserCertificate';
    pluralName: 'user-certificates';
    singularName: 'user-certificate';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::user-certificate.user-certificate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    filename: Attribute.String;
    issuedAt: Attribute.Date;
    issuedTo: Attribute.String;
    learning_space: Attribute.Relation<
      'api::user-certificate.user-certificate',
      'oneToOne',
      'api::learning-space.learning-space'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::user-certificate.user-certificate',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    user: Attribute.Relation<
      'api::user-certificate.user-certificate',
      'oneToOne',
      'plugin::users-permissions.user'
    >;
  };
}

export interface ApiUserChannelReadUserChannelRead
  extends Schema.CollectionType {
  collectionName: 'user_channel_reads';
  info: {
    description: 'Tracks the last message read by each user in each channel';
    displayName: 'User Channel Read';
    pluralName: 'user-channel-reads';
    singularName: 'user-channel-read';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    channel: Attribute.Relation<
      'api::user-channel-read.user-channel-read',
      'manyToOne',
      'api::channel.channel'
    > &
      Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'api::user-channel-read.user-channel-read',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    last_read_at: Attribute.DateTime & Attribute.Required;
    last_read_message: Attribute.Relation<
      'api::user-channel-read.user-channel-read',
      'manyToOne',
      'api::message.message'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'api::user-channel-read.user-channel-read',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    user: Attribute.Relation<
      'api::user-channel-read.user-channel-read',
      'manyToOne',
      'plugin::users-permissions.user'
    > &
      Attribute.Required;
  };
}

export interface PluginContentReleasesRelease extends Schema.CollectionType {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String & Attribute.Required;
    releasedAt: Attribute.DateTime;
    scheduledAt: Attribute.DateTime;
    status: Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Attribute.Required;
    timezone: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Schema.CollectionType {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    entry: Attribute.Relation<
      'plugin::content-releases.release-action',
      'morphToOne'
    >;
    isEntryValid: Attribute.Boolean;
    locale: Attribute.String;
    release: Attribute.Relation<
      'plugin::content-releases.release-action',
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Attribute.Enumeration<['publish', 'unpublish']> & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::content-releases.release-action',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginI18NLocale extends Schema.CollectionType {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Attribute.String & Attribute.Unique;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    name: Attribute.String &
      Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::i18n.locale',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginTranslateBatchTranslateJob
  extends Schema.CollectionType {
  collectionName: 'translate_batch_translate_jobs';
  info: {
    displayName: 'Translate Batch Translate Job';
    pluralName: 'batch-translate-jobs';
    singularName: 'batch-translate-job';
  };
  options: {
    comment: '';
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    autoPublish: Attribute.Boolean & Attribute.DefaultTo<false>;
    contentType: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::translate.batch-translate-job',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    entityIds: Attribute.JSON;
    failureReason: Attribute.JSON;
    progress: Attribute.Float & Attribute.DefaultTo<0>;
    sourceLocale: Attribute.String;
    status: Attribute.Enumeration<
      [
        'created',
        'setup',
        'running',
        'paused',
        'finished',
        'cancelled',
        'failed'
      ]
    > &
      Attribute.DefaultTo<'created'>;
    targetLocale: Attribute.String;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::translate.batch-translate-job',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginTranslateUpdatedEntry extends Schema.CollectionType {
  collectionName: 'translate_updated_entries';
  info: {
    displayName: 'Translate updated Entry';
    pluralName: 'updated-entries';
    singularName: 'updated-entry';
  };
  options: {
    comment: '';
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::translate.updated-entry',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    groupID: Attribute.String;
    localesWithUpdates: Attribute.JSON;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::translate.updated-entry',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUploadFile extends Schema.CollectionType {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Attribute.String;
    caption: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    ext: Attribute.String;
    folder: Attribute.Relation<
      'plugin::upload.file',
      'manyToOne',
      'plugin::upload.folder'
    > &
      Attribute.Private;
    folderPath: Attribute.String &
      Attribute.Required &
      Attribute.Private &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    formats: Attribute.JSON;
    hash: Attribute.String & Attribute.Required;
    height: Attribute.Integer;
    mime: Attribute.String & Attribute.Required;
    name: Attribute.String & Attribute.Required;
    previewUrl: Attribute.String;
    provider: Attribute.String & Attribute.Required;
    provider_metadata: Attribute.JSON;
    related: Attribute.Relation<'plugin::upload.file', 'morphToMany'>;
    size: Attribute.Decimal & Attribute.Required;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.file',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    url: Attribute.String & Attribute.Required;
    width: Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Schema.CollectionType {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.folder'
    >;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    files: Attribute.Relation<
      'plugin::upload.folder',
      'oneToMany',
      'plugin::upload.file'
    >;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    parent: Attribute.Relation<
      'plugin::upload.folder',
      'manyToOne',
      'plugin::upload.folder'
    >;
    path: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    pathId: Attribute.Integer & Attribute.Required & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::upload.folder',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Schema.CollectionType {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Attribute.String & Attribute.Required;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.permission',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.permission',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Schema.CollectionType {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    description: Attribute.String;
    name: Attribute.String &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    type: Attribute.String & Attribute.Unique;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    users: Attribute.Relation<
      'plugin::users-permissions.role',
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser extends Schema.CollectionType {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    age: Attribute.String;
    allowPrivateMessages: Attribute.Boolean;
    avatar: Attribute.Media<'images'>;
    blocked: Attribute.Boolean & Attribute.DefaultTo<false>;
    confirmationToken: Attribute.String & Attribute.Private;
    confirmed: Attribute.Boolean & Attribute.DefaultTo<false>;
    country: Attribute.String;
    createdAt: Attribute.DateTime;
    createdBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    email: Attribute.Email &
      Attribute.Required &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    interests: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToMany',
      'api::interest.interest'
    >;
    lastname: Attribute.String;
    learning_spaces: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToMany',
      'api::learning-space.learning-space'
    >;
    locale: Attribute.String & Attribute.DefaultTo<'en'>;
    location: Attribute.String;
    manager: Attribute.Boolean;
    motivation: Attribute.String;
    name: Attribute.String;
    nationality: Attribute.String;
    occupation: Attribute.String;
    organization: Attribute.String;
    password: Attribute.Password &
      Attribute.Private &
      Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Attribute.String;
    resetPasswordToken: Attribute.String & Attribute.Private;
    role: Attribute.Relation<
      'plugin::users-permissions.user',
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Attribute.DateTime;
    updatedBy: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'admin::user'
    > &
      Attribute.Private;
    user_avatar: Attribute.Relation<
      'plugin::users-permissions.user',
      'oneToOne',
      'api::user-avatar.user-avatar'
    >;
    username: Attribute.String &
      Attribute.Required &
      Attribute.Unique &
      Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface ContentTypes {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::administration.administration': ApiAdministrationAdministration;
      'api::bookmark.bookmark': ApiBookmarkBookmark;
      'api::certificate-payment.certificate-payment': ApiCertificatePaymentCertificatePayment;
      'api::certificate.certificate': ApiCertificateCertificate;
      'api::channel.channel': ApiChannelChannel;
      'api::email-template.email-template': ApiEmailTemplateEmailTemplate;
      'api::enrollment.enrollment': ApiEnrollmentEnrollment;
      'api::forum.forum': ApiForumForum;
      'api::interest.interest': ApiInterestInterest;
      'api::learning-space.learning-space': ApiLearningSpaceLearningSpace;
      'api::lesson.lesson': ApiLessonLesson;
      'api::mention.mention': ApiMentionMention;
      'api::message.message': ApiMessageMessage;
      'api::module.module': ApiModuleModule;
      'api::payment-intent.payment-intent': ApiPaymentIntentPaymentIntent;
      'api::pre-enrollement.pre-enrollement': ApiPreEnrollementPreEnrollement;
      'api::product.product': ApiProductProduct;
      'api::progress.progress': ApiProgressProgress;
      'api::quiz.quiz': ApiQuizQuiz;
      'api::space-manager.space-manager': ApiSpaceManagerSpaceManager;
      'api::submission.submission': ApiSubmissionSubmission;
      'api::subtitle.subtitle': ApiSubtitleSubtitle;
      'api::translation.translation': ApiTranslationTranslation;
      'api::unit.unit': ApiUnitUnit;
      'api::user-avatar.user-avatar': ApiUserAvatarUserAvatar;
      'api::user-certificate.user-certificate': ApiUserCertificateUserCertificate;
      'api::user-channel-read.user-channel-read': ApiUserChannelReadUserChannelRead;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::translate.batch-translate-job': PluginTranslateBatchTranslateJob;
      'plugin::translate.updated-entry': PluginTranslateUpdatedEntry;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
