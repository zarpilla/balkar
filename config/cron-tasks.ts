export default {
    myJob: {
      task: ({ strapi }) => {
        // Add your own logic here (e.g. send a queue of email, create a database backup, etc.).
        console.log("Hello from myJob");
        // delete "api::payment-intent.payment-intent" where state = "intent" and created_at < now() - interval '1 day';
        // strapi.entityService.deleteMany("api::payment-intent.payment-intent", {
        //   filters: {
        //     state: "intent",
        //     created_at_lt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        //   },
        // });
      },
      options: {
        rule: "*/30 * * * *",
      },
    },
  };