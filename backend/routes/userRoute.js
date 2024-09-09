const express = require("express");
const webpush = require("web-push");
const path = require("path");
const route = express.Router();
const passport = require("passport");
const {
  login,
  register,
  upload,
  download,
  uploadsuccess,
  downloadtext,
  subscribe,
  shareableLinkdownload,
  getFiles,
  generate,
  Delete,logout,sendResetEmail,resetPassword,reset
} = require("../controller/userController");
const auth = require("../config/auth");
route.post("/login", login);
route.post("/register", register);
route.post("/upload", auth, upload);  //done
route.get("/files",auth,getFiles)
// route.get("/upload/success/:uuid",auth,uploadsuccess)
route.get("/download/:id/:token",download); //
route.delete("/delete/:id",auth,Delete); 
// route.get("/files", auth, getFiles);
route.get("/generate/:id",auth,generate); // generate shareablelink for download ,it basically set the value of isShareable to true so that other can download this file
route.get("/download/share/:token/:id", shareableLinkdownload); 
route.post("/reset/password",sendResetEmail);
route.get("/reset/password/:name/:token",resetPassword);
route.post("/password",reset)
route.get("/logout",auth,logout)
// this will check is this shareable true if yes then anyone is able to download if no no one can download theirs file.
module.exports = {route};



// route.get("/download/logs/txt",downloadtext)
// route.post('/subscribe',subscribe);

//   Oauth

// const CLIENT_URL = "http://localhost:3000/";

// route.get("/login/success", (req, res) => {

//   if (req.user) {
//     res.status(200).json({
//       success: true,
//       message: "successfull",
//       user: req.user,


//     //   yaha add karna hai
//       //   cookies: req.cookies
//     });
//   } else {
//     res.json({
//       success: false,
//       user: null,
//     });
//   }
// });

// route.get("/login/failed", (req, res) => {
// //   res.status(401).json({
// //     success: false,
// //     message: "failure",
// //   });
// res.redirect("http://localhost:1234/44455615/515546465/65645646")
// });

// route.get("/logout", (req, res) => {
//   req.logout();
//   res.redirect(CLIENT_URL);
// });

// route.get(
//   "/api/auth/google",
//   passport.authenticate("google", { scope: ["profile","email"], session: false })
// );

// route.get(
//   "/auth/google/callback",
//   passport.authenticate("google", {
//     successRedirect: "http://localhost:3000/welcome",
//     failureRedirect: "/login/failed",
//     session:false
//   })
// );


