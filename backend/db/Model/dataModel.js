const mongoose = require("../connection/connection");
const schema = mongoose.Schema;
const dataschema = new schema({
  uuid: String,
  details: [{
    _id:false,
    path: String,
    file_name:String,
    mimetype:String,  
    size:Number,
    createdAt: Number,
    expireIn: Number,
    id:String,
    isShareable:{
      type:Boolean,
      default:false
    }

  }],
},{_id:false});

//  if products collection is not available in db then it automatically save collection as products name under the students
const dataModel = mongoose.model("filedata", dataschema);

module.exports = dataModel;
