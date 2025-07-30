# Localized Email Templates Implementation

This implementation adds support for localized email templates in your Strapi v4 application with internationalization.

## What's Been Added

### 1. Email Template Content Type
- **Location**: `src/api/email-template/`
- **Features**: 
  - Internationalization enabled
  - Two template types: `email_confirmation` and `reset_password`
  - Localized `subject` and `content` fields
  - Rich text editor for content

### 2. Users-Permissions Extension
- **Location**: `src/extensions/users-permissions/strapi-server.js`
- **Features**:
  - Overrides default email sending methods
  - Automatically detects user locale
  - Falls back to default Strapi behavior if no localized template exists
  - Supports multiple template variables

### 3. User Model Extension
- **Location**: `src/extensions/users-permissions/content-types/user/schema.json`
- **Added**: `locale` field with default value "en"

### 4. Bootstrap Script
- **Location**: `src/bootstrap/email-templates.ts`
- **Features**: Creates default English email templates on startup

## Template Variables

Your email templates can use these variables:

- `{{URL}}` - Confirmation/reset URL
- `{{USER}}` - Username or email
- `{{EMAIL}}` - User's email address
- `{{NAME}}` - User's name (falls back to username or email)

## How to Use

### 1. Start the Application
After restart, the system will automatically create default English email templates.

### 2. Create Localized Templates
1. Go to Content Manager → Email Templates
2. Create new templates for each language you support
3. Set the correct locale for each template
4. Use the template variables in your content

### 3. Set User Locale
Users can have their locale set in the `locale` field. This will be used to determine which email template to send.

### 4. Example Templates

**Email Confirmation (English)**
- Type: `email_confirmation`
- Subject: "Please confirm your email address"
- Content: HTML with `{{URL}}`, `{{NAME}}` variables

**Email Confirmation (Spanish)**
- Type: `email_confirmation`
- Subject: "Por favor confirma tu dirección de email"
- Content: HTML with `{{URL}}`, `{{NAME}}` variables

**Reset Password (English)**
- Type: `reset_password`
- Subject: "Reset your password"
- Content: HTML with `{{URL}}`, `{{NAME}}` variables

## Fallback Behavior

If no localized template is found for a user's locale, the system will:
1. Fall back to Strapi's default email templates
2. Log the fallback for debugging purposes

## Logging

The system logs email sending activities:
- Successful localized email sends
- Fallbacks to default templates
- Errors during template lookup or sending

## Supported Email Providers

This implementation works with any Strapi email provider, including:
- SendGrid (currently configured)
- Nodemailer
- Other email providers

## Next Steps

1. Restart your Strapi application
2. Check the Content Manager for the new "Email Templates" collection
3. Create templates in your supported languages
4. Test email functionality with different user locales
