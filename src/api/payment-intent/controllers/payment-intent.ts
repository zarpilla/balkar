/**
 * payment-intent controller
 */

import { factories } from "@strapi/strapi";
import { v4 as uuidv4 } from "uuid";
import { sendPaymentEmails } from "../services/payment-intent";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const unparsed = Symbol.for("unparsedBody");

const endpointSecret = process.env.STRIPE_WEBHOOK_PI_SECRET;

const sendEmailToAdmin = async (strapi, product, data) => {
  const emailData = {
    to: product.paymentEmails.split(","),
    subject: `New payment for ${product.name}`,
    text: `A new payment has been received for "${product.name}" with name "${data.name} ${data.lastname}" and email "${data.email}"`,
  };
  await strapi.plugins["email"].services.email.send(emailData);
};

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
            // Then define and call a function to handle the event payment_intent.succeeded
            const paymentIntentSucceded = event.data.object;
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

            // const stripePaymentIntentId = event.data.object.id;
            // const stripePaymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

            // const amount = stripePaymentIntent.amount_received;
            // const customer = stripePaymentIntent.charges.data[0].billing_details.name;

            // const emailData = {
            //   to: product.paymentEmails.split(","),
            //   subject: `New payment for ${product.name}`,
            //   text: `A new payment has been received for "${product.name}" with name "${data.name} ${data.lastname}" and email "${data.email}"`,
            // };
            // await strapi.plugins["email"].services.email.send(emailData);

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
    createCheckoutSession: async (ctx, next) => {
      try {
        const spaceUid = ctx.params.id;
        const { email, name, lastname, locale } = ctx.request.body;
        const texts = {
          en: {
            name: "Name",
            lastname: "Last Name",
          },
          ca: {
            name: "Nom",
            lastname: "Cognom",
          },
        };
        const spaces = await strapi.entityService.findMany(
          "api::learning-space.learning-space",
          {
            filters: {
              uid: spaceUid,
            },
            populate: ["product"],
          }
        );

        if (spaces.length > 0) {
          const space: any = spaces[0];
          const productId = space.product.id;
          const product = await strapi.entityService.findOne(
            "api::product.product",
            productId
          );
          if (product) {
            const sessionData = {
              payment_method_types: ["card"],
              customer_email: email,
              line_items: [
                {
                  price: product.stripePriceId,
                  quantity: 1,
                },
              ],
              mode: "payment",
              success_url: `${process.env.FRONTEND_URL}/enroll/${spaceUid}?success={CHECKOUT_SESSION_ID}`,
              cancel_url: `${process.env.FRONTEND_URL}/enroll/${spaceUid}?success=false`,
              custom_fields: [
                {
                  key: "name",
                  label: {
                    type: "custom",
                    custom: texts[locale] ? texts[locale].name : texts.en.name,
                  },
                  type: "text",
                  text: {
                    default_value: name || ctx.state.user.name,
                  },
                },
                {
                  key: "lastname",
                  label: {
                    type: "custom",
                    custom: texts[locale]
                      ? texts[locale].lastname
                      : texts.en.lastname,
                  },
                  type: "text",
                  text: {
                    default_value: lastname || ctx.state.user.lastname,
                  },
                },
              ],
            };

            const session = await stripe.checkout.sessions.create(sessionData);

            await strapi.entityService.create(
              "api::payment-intent.payment-intent",
              {
                data: {
                  name: session.id,
                  state: "intent",
                  data: JSON.stringify({
                    spaceUid,
                    product,
                    email: email,
                    name,
                    lastname,
                    locale,
                  }),
                },
              }
            );
            ctx.body = { url: session.url };
          }
        }
      } catch (err) {
        console.error("createCheckoutSession error", err);
        ctx.badRequest(`createCheckoutSession Error: ${err.message}`);
      }
    },
    checkPaymentIntent: async (ctx, next) => {
      // check if the body param id exists in "api::payment-intent.payment-intent" (column name)
      const { id, spaceUid } = ctx.request.body;

      const session = await stripe.checkout.sessions.retrieve(id);

      if (session && session.status === "complete") {
        // find "api::payment-intent.payment-intent"
        // if it exists, return the email
        // if not, return false
        const intents = await strapi.entityService.findMany(
          "api::payment-intent.payment-intent",
          {
            filters: {
              name: id,
            },
          }
        );

        if (intents && intents.length === 1) {
          const intent = intents[0];
          const data = JSON.parse(intent.data);

          // create api::enrollment.enrollment
          const enrollment = await strapi.entityService.create(
            "api::pre-enrollement.pre-enrollement",
            {
              data: {
                email: data.email,
                uid: data.spaceUid,
                name: data.name,
                lastname: data.lastname,
              },
            }
          );

          // update intent
          await strapi.entityService.update(
            "api::payment-intent.payment-intent",
            intent.id,
            {
              data: {
                state: "received",
              },
            }
          );

          const product = await strapi.entityService.findOne(
            "api::product.product",
            data.product.id
          );
          if (product && product.paymentEmails) {
            const emailData = {
              to: product.paymentEmails.split(","),
              subject: `New payment for ${product.name}`,
              text: `A new payment has been received for "${product.name}" with name "${data.name} ${data.lastname}" and email "${data.email}"`,
            };
            await strapi.plugins["email"].services.email.send(emailData);
          }

          ctx.body = {
            ok: true,
            email: session.customer_email,
            name: data.name,
            lastname: data.lastname,
          };
        }
      } else {
        ctx.body = { ok: false };
      }
    },
    sendPaymentEmails: async (ctx, next) => {
      const body = await sendPaymentEmails();
      ctx.body = body;
      return;
    },
  })
);
