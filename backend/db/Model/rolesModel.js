const mongoose = require("../connection/connection");
const schema = mongoose.Schema;
const rolesschema = new schema({
  uuid: String,
  roles: {
    type: [String],
    default: ["user"],
  },
});
//  if products collection is not available in db then it automatically save collection as products name under the students
const rolesModel = mongoose.model("roles", rolesschema);
module.exports = rolesModel;
