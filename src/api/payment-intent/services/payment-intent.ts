/**
 * payment-intent service
 */

import { factories } from "@strapi/strapi";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default factories.createCoreService(
  "api::payment-intent.payment-intent"
);
async function sendPaymentEmails() {
  const paymentIntents = await strapi.entityService.findMany(
    "api::payment-intent.payment-intent",
    {
      filters: {
        state: "received",
      },
      sort: {
        createdAt: "asc",
      },
    }
  );
  const stripePaymentIntents = [];
  const errors = [];
  // get details from stripe paymmet intent
  for (const paymentIntent of paymentIntents) {
    //console.log('paymentIntent', paymentIntent)
    const id = paymentIntent.id;
    try {
      const stripePaymentIntent = JSON.parse(paymentIntent.data);
      const piid = stripePaymentIntent.id;
      const latest_charge = stripePaymentIntent.latest_charge;
      const status = stripePaymentIntent.status;
      if (status === "succeeded" && latest_charge) {
        const charge = await stripe.charges.retrieve(latest_charge);
        const name = charge.billing_details?.name;
        const email = charge.billing_details?.email;
        const amount = charge.amount / 100;
        const createdDate = new Date(charge.created * 1000);
        const sessions = await stripe.checkout.sessions.list({
          payment_intent: piid,
        });
        if (sessions && sessions.data.length > 0) {
          const lineItems = await stripe.checkout.sessions.listLineItems(
            sessions.data[0].id
          );
          if (lineItems && lineItems.data.length > 0) {
            const description = lineItems.data[0].description;
            stripePaymentIntents.push({
              id,
              piid,
              name,
              email,
              amount,
              createdDate,
              description,
            });
          }
        } else {
          stripePaymentIntents.push({
            id,
            piid,
            name,
            email,
            amount,
            createdDate,
            description: "",
          });
        }
      }
    } catch (error) {
      errors.push(error);
      console.error("error");
      await strapi.entityService.update(
        "api::payment-intent.payment-intent",
        id,
        {
          data: {
            state: "error",
          },
        }
      );
    }
  }

  if (stripePaymentIntents.length === 0 && errors.length === 0) {
    return { ok: true, paymentIntents: 0 };
  }

  const emailContent = `
    <h1>Nous Pagaments Rebuts a Stripe</h1>
    <table border="1" cellpadding="5" cellspacing="0">
      <thead>
        <tr>              
          <th>Nom</th>
          <th>Email</th>
          <th>Import</th>
          <th>Data</th>
          <th>Concepte</th>
          <th>Id</th>
        </tr>
      </thead>
      <tbody>
        ${stripePaymentIntents
          .map(
            (intent) => `
          <tr>                
            <td>${intent.name}</td>
            <td>${intent.email}</td>
            <td>${intent.amount}</td>
            <td>${new Date(intent.createdDate).toLocaleString()}</td>
            <td>${intent.description}</td>
            <td>${intent.id}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
    <br>
    <br>
    <p>
    Hi ha hagut ${errors} errors recuperant les dades.
    </p>
  `;

  // get from administration single type the field paymentEmails, and split by comma
  const administration = await strapi.entityService.findMany(
    "api::administration.administration",
    {}
  );

  const response = await strapi.plugins["email"].services.email.send({
    to: administration.paymentEmails.split(","),
    subject: "Nous Pagaments Rebuts a Stripe",
    html: emailContent,
  });

  for (const intent of paymentIntents) {
    await strapi.entityService.update(
      "api::payment-intent.payment-intent",
      intent.id,
      {
        data: {
          state: "handled",
        },
      }
    );
  }

  return {
    ok: true,
    paymentIntents: stripePaymentIntents.length,
    errors: errors.length,
  };
}

export { sendPaymentEmails };
