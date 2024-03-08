/**
 * account router
 */

export default {
  routes: [
    {
      method: "POST",
      path: "/enrollments/enroll",
      handler: "enrollment.enroll",
    },
    {
      method: "POST",
      path: "/enrollments/autoenroll",
      handler: "enrollment.autoenroll",
    }
  ],
};
