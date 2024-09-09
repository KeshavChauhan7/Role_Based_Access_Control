const mongoose = require("../connection/connection");
const schema = mongoose.Schema;
const permissionsschema = new schema({
    uuid: String,
    permissions: {
      type: [String],
      default: ["view","upload","download","shareable","delete","reset-password"]
    }
});
//  if products collection is not available in db then it automatically save collection as products name under the students
const permissionModel = mongoose.model("permissions", permissionsschema);
module.exports = permissionModel;
