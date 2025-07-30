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
      provider: "@strapi/provider-email-nodemailer",
      providerOptions: {
        host: env("SMTP_HOST") || "localhost",
        port: env("SMTP_PORT") || 587,
        auth: {
          user: env("SMTP_USER"),
          pass: env("SMTP_PASS"),
        },
        secure: env("SMTP_SECURE") === "true", // true for 465, false for other ports
      },
      settings: {
        defaultFrom: env("EMAIL_FROM"),
        defaultReplyTo: env("EMAIL_FROM"),
      },
    },
  },
});
