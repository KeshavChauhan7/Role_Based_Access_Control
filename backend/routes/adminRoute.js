const express = require("express");
const admin = express.Router();
const auth=require("../config/auth")
const authforadminAccountcreation=require("../config/authforadminAccountcreation")
const {getUsers,createUser,createadminAccount,verifyAdmin,login,getUser,updateAuser,deleteAuser,deleteUsers,upload,userfiles,updatefile,deletefile,logout,download}=require("../controller/adminController");
admin.post("/create/new/:secret",authforadminAccountcreation,createadminAccount) //done
admin.get("/verify/:secret/:token",authforadminAccountcreation,verifyAdmin);  //done
admin.post("/login",login)  //done
admin.post("/create/user",auth,createUser); //done
admin.put("/update/:uuid",auth,updateAuser) // done
admin.get("/users",auth,getUsers); //done
admin.get("/user/:uuid",auth,getUser); //done
admin.delete("/delete/:uuid",auth,deleteAuser)  //done
admin.delete("/delete/all/users",auth,deleteUsers) //done

// crud on indiviudal user
//done 
admin.post("/upload/:uuid",auth,upload); // done
admin.get("/file/:uuid",auth,userfiles) //done
admin.put("/update/file/:uuid/:id",auth,updatefile) //done
admin.delete("/delete/file/:uuid/:id",auth,deletefile) // done 
admin.get("/download/:uuid/:id/:token",download) // done
admin.get("/logout",auth,logout);   // done
module.exports={admin}