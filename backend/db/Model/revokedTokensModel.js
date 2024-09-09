const mongoose = require("../connection/connection");
const schema = mongoose.Schema;
const revokedschema = new schema({
    uuid: String,
    token:String
});
//  if products collection is not available in db then it automatically save collection as products name under the students
const revokedtokenModel = mongoose.model("revokedtokens", revokedschema);
module.exports = revokedtokenModel;
