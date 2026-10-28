import { errors } from "@strapi/utils";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Products are mirrored in Stripe. When Stripe refuses a change, saving fails with the Stripe
 * error in the admin panel instead of leaving the product and Stripe out of step.
 */
const stripeError = (action: string, e: any) => {
  console.error(`Stripe: could not ${action}`, e);
  return new errors.ApplicationError(
    `Stripe: could not ${action}: ${e?.message || e}. Nothing was saved.`
  );
};

const cents = (price: any) => Math.round(Number(price) * 100);

const createInStripe = async (product: any) =>
  stripe.products.create({
    name: product.name,
    description: product.description || undefined,
    default_price_data: {
      unit_amount: cents(product.price),
      currency: "EUR",
    },
  });

export default {
  beforeCreate: async (event) => {
    const data = event.params.data;
    if (data.stripeProductId || data.price === undefined || data.price === null) return;
    try {
      const product = await createInStripe(data);
      data.stripeProductId = product.id;
      data.stripePriceId = product.default_price;
    } catch (e) {
      throw stripeError("create the product", e);
    }
  },

  beforeUpdate: async (event) => {
    const data = event.params.data;
    const id = event.params.where?.id ?? data.id;
    if (!id) return;
    const previous: any = await strapi.entityService.findOne("api::product.product", id);
    if (!previous) return;

    const next = { ...previous, ...data };

    try {
      // Products whose creation in Stripe failed earlier.
      if (!previous.stripeProductId) {
        if (next.price === undefined || next.price === null) return;
        const product = await createInStripe(next);
        data.stripeProductId = product.id;
        data.stripePriceId = product.default_price;
        return;
      }

      if (
        ("name" in data && data.name !== previous.name) ||
        ("description" in data && data.description !== previous.description)
      ) {
        await stripe.products.update(previous.stripeProductId, {
          name: next.name,
          description: next.description || "",
        });
      }

      if ("price" in data && Number(data.price) !== Number(previous.price)) {
        const price = await stripe.prices.create({
          currency: "EUR",
          unit_amount: cents(data.price),
          product: previous.stripeProductId,
        });
        await stripe.products.update(previous.stripeProductId, {
          default_price: price.id,
        });
        // Saved with this same update (an update from here would run these hooks again).
        data.stripePriceId = price.id;
      }
    } catch (e) {
      throw stripeError("update the product", e);
    }
  },

  afterUpdate: async (event) => {
    const data = event.result;
    if (!data?.stripeProductId || !data.image?.url) return;
    try {
      await stripe.products.update(data.stripeProductId, {
        images: [`${process.env.STRAPI_URL || strapi.config.get("server.url")}${data.image.url}`],
      });
    } catch (e) {
      // The image is cosmetic: don't block saving for it.
      console.error("Stripe: could not update the product image", e);
    }
  },
};
