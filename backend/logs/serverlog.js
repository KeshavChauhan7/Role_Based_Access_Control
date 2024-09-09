const fs =require("fs");
const path =require("path")
const accessLogStream = fs.createWriteStream(path.join(__dirname,"serverlog.log"), { flags: 'a' });
module.exports=accessLogStream