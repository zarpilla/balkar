import { v4 as uuidv4 } from "uuid";

export default {
  beforeCreate(event) {
    if (!event.params.data.uid) {
      event.params.data.uid = uuidv4();
    }
    
  },
};
