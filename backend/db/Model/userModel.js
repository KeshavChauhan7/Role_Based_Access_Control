const mongoose = require("../connection/connection");
const schema = mongoose.Schema;
  const userschema = new schema({
    isActive:{
      type:Boolean,
      default:false
    },
    uuid: String,
    name:String,
    email:String,
    password:String,
    isAdmin: {
      type: Boolean,
      default: false
    },
    isVerified:{
      type:Boolean,
      default:false
    }

  });

//  if products collection is not available in db then it automatically save collection as products name under the students
const userModel = mongoose.model("users", userschema);
module.exports = userModel;


