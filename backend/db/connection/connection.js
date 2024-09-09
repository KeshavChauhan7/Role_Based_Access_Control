const mongoose = require("mongoose");
const promise = mongoose.connect(process.env.DB_URL);
promise
  .then((value) => {
    console.log("Connection with mongodb atlas is Created...");
  })
  .catch((err) => {
    console.log("Connection Error ", err);
  });
module.exports = mongoose;
