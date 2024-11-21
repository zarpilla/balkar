/**
 * paymentIntent router
 */

export default {
  routes: [
    {
      method: "GET",
      path: "/payment-intents/send",
      handler: "payment-intent.sendPaymentEmails",
    },
    {
      method: "POST",
      path: "/payment-intents/create-checkout-session/:id",
      handler: "payment-intent.createCheckoutSession",
    },
    {
      method: "POST",
      path: "/payment-intents/check",
      handler: "payment-intent.checkPaymentIntent",
    }
  ],
  
};
