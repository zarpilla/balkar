export default {
  routes: [
    {
      // Events of a course's calendar (enrolled people and the course's managers)
      method: "GET",
      path: "/events/space/:uid",
      handler: "event.findBySpace",
    },
  ],
};
