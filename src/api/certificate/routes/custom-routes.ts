export default {
  routes: [
    {
      method: "POST",
      path: "/certificates/issue/:uid",
      handler: "certificate.issue",
    },
    {
      // Public: anyone with the code (QR or link on the certificate) can check it.
      method: "GET",
      path: "/certificates/verify/:code",
      handler: "certificate.verify",
      config: { auth: false },
    },
  ],
};
