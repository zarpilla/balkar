/**
 * event router (core routes; only findBySpace in custom-routes is granted to users)
 */

import { factories } from "@strapi/strapi";

export default factories.createCoreRouter("api::event.event");
