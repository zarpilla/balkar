/**
 * payment-intent controller
 */

import { factories } from "@strapi/strapi";
const unparsed = require("koa-body/unparsed.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const endpointSecret =
  "whsec_728fb1e9e420458b3831e037e34fc1c3314d1f77367d190208569c6fa6d0524f";

export default factories.createCoreController(
  "api::payment-intent.payment-intent",
  ({ strapi }) => ({
    create: async (ctx, next) => {
      try {
        const sig = ctx.request.header["stripe-signature"];
        const unparsedBody = ctx.request.body[unparsed];
        const event = stripe.webhooks.constructEvent(
          unparsedBody,
          sig,
          endpointSecret
        );
        
        switch (event.type) {
          case "payment_intent.succeeded":
          case "payment_intent.created":
            // Then define and call a function to handle the event payment_intent.succeeded
            const paymentIntent = await strapi.entityService.create(
              "api::payment-intent.payment-intent",
              {
                data: {
                  data: JSON.stringify(event.data.object),
                  name: event.type,
                  state: "received",
                },
              }
            );
            ctx.send(paymentIntent);
            break;
          // ... handle other event types
          default:
            ctx.send({ received: true });
        }
      } catch (err) {
        console.error("create payment intent error", err);
        ctx.badRequest(`Webhook Error: ${err.message}`);
      }
    },
  })
);
