import { sendPaymentEmails } from "../src/api/payment-intent/services/payment-intent";
export default {
  cronJob: {
    task: async ({ strapi }) => {
      // An uncaught error here (e.g. SMTP login failure) crashes the whole
      // server, so log it and try again on the next run.
      try {
        await sendPaymentEmails();
      } catch (error) {
        console.error(
          "[cron] sendPaymentEmails failed:",
          error instanceof Error ? error.message : error
        );
      }
    },
    options: {
      rule: "*/10 * * * *",
    },
  },
};
