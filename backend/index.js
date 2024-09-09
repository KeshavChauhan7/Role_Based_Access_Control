const express = require("express");
require("dotenv").config();
const {logger} = require("./logs/applog")
process.on("uncaughtException", (error) => {
  logger.error(error);
  console.error("Uncaught Exception:!!!!!!", error);
});
const {route} = require("./routes/userRoute");
const {admin}=require("./routes/adminRoute")
const app = express();
const morgan = require('morgan');
const fs = require("fs");
const path = require("path");
const mail = require("./mail/mail");
const cron = require("node-cron");
// server logging
const accessLogStream =require("./logs/serverlog")
app.use(morgan('combined', { stream: accessLogStream }));

//  logging app level errors

const cors = require("cors");
const model = require("./db/Model/dataModel");
const fileUpload = require("express-fileupload");
// var session = require('express-session')

app.use(fileUpload());
// app.use(express.static(path.join(__dirname, 'static')));
// app.use(express.static("public"));
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
// const passportSetup = require("./passport/passport");
// const passport =require("passport")
// app.use(passport.initialize())
// app.use(passport.session());
app.use("/", route);  
app.use("/admin",admin)
app.use((req,res,next)=>{ 
  res.status(404).json({OOPS:'Wrong endpoint'})
})
const server = app.listen(process.env.PORT || 1234, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("server started at", server.address().port);
  }
});
async function cronJob() {
  let time = Math.floor(Date.now() / 1000);
  const result = await model.find({ expireIn: { $lt: time } }).exec();
  await model.deleteMany({ expireIn: { $lt: time } });
  if (!(result.length === 0)) {
    var len = result.length;
    var error = false;
    for (var file of result) {
      try {
        await new Promise((resolve, reject) => {
          fs.unlink(path.join(__dirname, "files", file.path), (err) => {
            if (err) {
              console.error("Error deleting file:", err);
              error = true;
              reject(err);
            } else {
              console.log(`File ${file.path} deleted successfully`);
              resolve();
            }
          });
        });
      } catch (err) {
        // Handle the error
        console.error("Error deleting files:", err);
        error = true;
      }
    }

    if (error) {
      console.log(
        "Files are not deleted from the server. Some error occurred."
      );
      mail({
        subject: "Files are not deleted from server",
        text: "Files are not deleted. Some error occurred.",
      });
    } else {
      console.log("All files deleted successfully from the server.");
      mail({
        subject: "Files are deleted from server",
        text: `${len} files were deleted.`,
      });
    }
  } else {
    mail({ subject: "No files", text: "There are no files to delete" });
  }
}

const task = cron.schedule("0 0 * * *", cronJob);
task.start();
