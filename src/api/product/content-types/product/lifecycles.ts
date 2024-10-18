const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default {
  afterCreate: async (event) => {
    try {
      const data = event.result;
      const product = await stripe.products.create({
        name: data.name,
        description: data.description,
        // active: data.publishedAt !== null,
        default_price_data: {
          unit_amount: data.price * 100,
          currency: "EUR",
        },
      });
      await strapi.entityService.update("api::product.product", data.id, {
        data: {
          stripeProductId: product.id,
          stripePriceId: product.default_price,
        },
      });
    } catch (e) {
      console.error("afterCreate error", e);
    }
  },
  beforeUpdate: async (event) => {
    try {
      const data = event.params.data;
      const previous = await strapi.entityService.findOne(
        "api::product.product",
        data.id
      );
      if (data.name !== previous.name || data.description !== previous.description || data.publishedAt !== previous.publishedAt) {
        await stripe.products.update(data.stripeProductId, {
          name: data.name,
          description: data.description,
          // active: data.publishedAt !== null,
        });        
      }

      if (data.price !== previous.price) {
        const price = await stripe.prices.create({
          currency: "EUR",
          unit_amount: data.price * 100,
          product: data.stripeProductId,
        });

        await stripe.products.update(data.stripeProductId, {
          default_price: price.id,
        });

        await strapi.entityService.update("api::product.product", data.id, {
          data: {
            stripePriceId: price.id,
          },
        });
      }
    } catch (e) {
      console.error("afterUpdate error", e);
    }
  },
  afterUpdate: async (event) => {
    const data = event.result;    
    if (data.image && data.image.url) {
      await stripe.products.update(data.stripeProductId, {        
        images: [`${process.env.STRAPI_URL}${data.image.url}`],
      });
    }
  }
};
