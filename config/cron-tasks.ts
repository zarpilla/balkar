import { sendPaymentEmails } from "../src/api/payment-intent/services/payment-intent";
export default {
  cronJob: {
    task: async ({ strapi }) => {
      await sendPaymentEmails();
    },
    options: {
      rule: "*/10 * * * *",
    },
  },
};
