export default ({ env }) => ({
  email: {
    config: {
      // provider: "sendgrid",
      // providerOptions: {
      //   apiKey: env("SENDGRID_API_KEY"),
      // },
      // settings: {
      //   defaultFrom: env("EMAIL_FROM"),
      //   defaultReplyTo: env("EMAIL_FROM"),
      // },
      provider: '@strapi/provider-email-nodemailer',
          providerOptions: {
            host: env("SMTP_HOST") || 'localhost',
            port: env("SMTP_PORT") || 587,
            auth: {
              user: env("SMTP_USER"),
              pass: env("SMTP_PASS"),
            },
            secure: env("SMTP_SECURE") === 'true', // true for 465, false for other ports
          },
          settings: {
            defaultFrom: env("EMAIL_FROM"),
            defaultReplyTo: env("EMAIL_FROM"),
          },
    },
  },
  // ...
  translate: {
    enabled: !!env('DEEPL_API_KEY'),
    config: {
      // Choose one of the available providers
      provider: 'deepl',
      // Pass credentials and other options to the provider
      providerOptions: {
        // your API key - required and wil cause errors if not provided
        apiKey: env('DEEPL_API_KEY') || 'dummy-key',
        // use custom api url - optional
        apiUrl: 'https://api-free.deepl.com',
        // use custom locale mapping (for example 'en' locale is deprecated so need to choose between 'EN-GB' and 'EN-US')
        localeMap: {
          // use uppercase here!
          EN: 'EN-US',
        },
        // Optional: Pass glossaries on translation. The correct glossary for each translation is selected by the target_lang and source_lang properties 
        // glossaries: [
        //   {
        //     id: "your-glossary-id",
        //     target_lang: "DE",
        //     source_lang: "EN",
        //   }
        // ],
        apiOptions: {
          // see <https://github.com/DeepLcom/deepl-node#text-translation-options> for supported options.
          // note that tagHandling Mode and glossary cannot be set this way.
          // use with caution, as non-default values may break translation of markdown
          formality: 'default',
          // ...
        },
      },
      // other options ...
    },
  },
  // ...

});
