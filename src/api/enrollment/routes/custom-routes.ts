/**
 * account router
 */

export default {
  routes: [
    {
      method: "POST",
      path: "/enrollments/enroll",
      handler: "enrollment.enroll",
    }
  ],
};
