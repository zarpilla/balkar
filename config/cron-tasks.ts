// import { sendPaymentEmails } from "../src/api/payment-intent/services/payment-intent";

export default {
  cronJob: {
    task: async ({ strapi }) => {
      try {
        // await sendPaymentEmails(strapi);
      } catch (error) {
        console.error('Cron job error:', error);
      }
    },
    options: {
      rule: "*/10 * * * *",
    },
  },
};
