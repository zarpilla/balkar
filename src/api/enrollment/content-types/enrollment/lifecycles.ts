export default {
  async afterCreate(event) {
    //console.log("afterCreate", event.result);
    const data = await strapi.entityService.findOne(
      "api::enrollment.enrollment",
      event.result.id,
      { populate: ["users_permissions_user", "learning_space"] }
    );

    const spaceName = data.learning_space.name;
    const email = data.users_permissions_user.email;
    const name = data.users_permissions_user.name;
    const lastname = data.users_permissions_user.lastname;
    const enrollmentEmails = data.learning_space.enrollmentEmails;
    

    if (enrollmentEmails) {
      const emailData = {
        to: enrollmentEmails.split(","),
        subject: `New enrollment in ${spaceName}`,
        text: `A new user has enrolled in "${spaceName}" with name "${name} ${lastname}" and email "${email}"`,
      };
      await strapi.plugins["email"].services.email.send(emailData);
    }
  },
};
