const createEmailTemplates = async () => {
  try {
    // Check if email templates already exist
    const existingTemplates = await strapi.entityService.findMany('api::email-template.email-template' as any, {
      publicationState: 'live'
    });

    if (existingTemplates && Array.isArray(existingTemplates) && existingTemplates.length > 0) {
      strapi.log.info('Email templates already exist, skipping creation');
      return;
    }

    // Default English templates
    const templates = [
      {
        type: 'email_confirmation',
        subject: 'Please confirm your email address',
        content: `
          <h2>Welcome to our platform!</h2>
          <p>Hello {{NAME}},</p>
          <p>Thank you for registering. Please confirm your email address by clicking the link below:</p>
          <p><a href="{{URL}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirm Email</a></p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>{{URL}}</p>
          <p>Best regards,<br>The Team</p>
        `,
        locale: 'en',
        publishedAt: new Date()
      },
      {
        type: 'reset_password',
        subject: 'Reset your password',
        content: `
          <h2>Password Reset Request</h2>
          <p>Hello {{NAME}},</p>
          <p>We received a request to reset your password. Click the link below to create a new password:</p>
          <p><a href="{{URL}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>{{URL}}</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <p>Best regards,<br>The Team</p>
        `,
        locale: 'en',
        publishedAt: new Date()
      }
    ];

    // Create English templates
    for (const template of templates) {
      try {
        await strapi.entityService.create('api::email-template.email-template' as any, {
          data: template
        });
        strapi.log.info(`Created ${template.type} email template in ${template.locale}`);
      } catch (error) {
        strapi.log.error(`Error creating ${template.type} template:`, error);
      }
    }

    strapi.log.info('Email templates created successfully');
  } catch (error) {
    strapi.log.error('Error creating email templates:', error);
  }
};

module.exports = { createEmailTemplates };