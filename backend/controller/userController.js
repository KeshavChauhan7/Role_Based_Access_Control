const { generateToken, compareToken } = require("../config/tokenGenCom");
const uploadschema = require("../db/Model/dataModel");
const userModel = require("../db/Model/userModel");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs =require("fs");
const rolesModel = require("../db/Model/rolesModel");
const permissionModel = require("../db/Model/permissionModel");
const dataModel = require("../db/Model/dataModel");
const { hashpassword, checkpass } = require("../config/hashpassword");
const { loginValidate, registerValidate, passwordValidate, emailValidate } = require("../config/validation");
const mail = require("../mail/mail");
const revokedtokenModel = require("../db/Model/revokedTokensModel");

const usercontroller = {
  async login(request, response) {
    const body = request.body;
    // first validate req.body data 
    const  {error,value} =   loginValidate().validate(request.body)
          if(error)
        return response.json({ status: false, error: error.details[0].message });

    // find object in name is equal to provided user name
    const sd = await userModel.findOneAndUpdate(
      {
        $and: [{ name: value.name.trim() }, { isAdmin: false }],
      },
      { $set: { isActive: true } },
      { new: true }
    );
    if (sd && sd.name) {
      if (checkpass(value.password.trim(), sd.password)) {
        const token = generateToken({ uuid: sd.uuid });
        response.json({ result: token, status: true });
      } else {
        response.json({ error: "wrong password", status: false });
      }
    } else {
      response.json({ status: false, error: "no user exist" });
    }
  },
  async register(request, response) {
    const body = request.body;
    const {error,value} =  registerValidate().validate(request.body);
    if(error)
    return response.json({ status: false, error: error.details[0].message });
    // const existInDB=  await  registerschema.findOne({name:body.name})
    const existInDB = await userModel.findOne({
      $or: [{ name: value.name.trim() }, { email: value.email.trim() }],
    });
    // console.log(existInDB.name,existInDB.subscription.endpoint)
    // optional give one condition
    if (existInDB && (existInDB.name || existInDB.email)) {
       return response.status(200).json({
        status: false,
        error: "A user exist with same name, please try different one!!!",
      });
    } else {
      const uuid = uuidv4();
      const hashpass = hashpassword(value.password.trim());
      let user = await userModel({
        uuid: uuid,
        name: value.name.trim(),
        email: value.email.trim(),
        password: hashpass,
      });
      //by default, a user will get user role and below permissions
      user = await user.save();
      let roles = rolesModel({
        uuid: uuid,
        roles: ["user"],
      });
      roles = await roles.save();

      let permission = await permissionModel({
        uuid: uuid,
        permissions: ["view", "download", "upload", "delete", "shareable","reset-password"],
      });
      permission = await permission.save();

      response.status(200).json({
        status: true,
        result: { user: user, roles: roles, permission: permission },
      });
    }
  },
  async upload(req, res) {
    let sampleFile;
    let uploadPath;
    const decodedtoken = req.decode;
    const user = await userModel
      .aggregate([
        {
          $match: { uuid: decodedtoken.uuid }, // Match the document with the specified UUID
        },
        {
          $lookup: {
            from: "roles", // The "roles" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "roles",
          },
        },
        {
          $lookup: {
            from: "permissions", // The "permissions" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "permissions",
          },
        },
      ])
      .exec();

    if (user.length === 0) {
      return res.json({
        status: false,
        error: " this User does not exist in db",
      });
    }
    const userRole =
      user[0].roles[0].roles.findIndex((role) => role === "user") >= 0;
    const userPermission =
      user[0].permissions[0].permissions.findIndex((per) => per === "upload") >=
      0;

    if (user && userRole && userPermission) {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res
          .status(400)
          .json({ status: false, error: "No files were uploaded." });
      }
      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      // res.json({file:req.files.sampleFile})
      let date = Math.floor(Date.now() / 1000);
      let expireIn = date + 24 * 60 * 60;
      sampleFile = req.files.sampleFile;

      uploadPath = path.normalize(__dirname + "/..");
      let filepath = date + "_" + sampleFile.name;
      uploadPath = path.join(uploadPath, "files", filepath);

      sampleFile.mv(uploadPath, async function (err) {
        if (err) return res.status(500).json({ status: false, error: err });
        let newObject = {
          path: filepath,
          file_name: sampleFile.name,
          mimetype:sampleFile.mimetype,
           size:sampleFile.size,
          createdAt: date,
          expireIn: expireIn,
          id: uuidv4(),
        };
        let result = await dataModel.findOneAndUpdate(
          { uuid: decodedtoken.uuid },
          { $push: { details: newObject } },
          { new: true, upsert: true } // upsert:true-> if dont get it , it create it auto
        );

        res.status(200).json({ status: true, result: result });
      });
    } else {
      res.json({ status: false, error: "You are not allowed to upload!!!" });
    }
  },
  async download(req, res) {
    let id = req.params.id;
    // const decodedtoken = req.decode;
    const tokenresult = compareToken(req.params.token);
    if (!tokenresult.status)
      return res.json({ status: false, error: "not a valid token!!!" });
    const uuid = tokenresult.decode.uuid;
    const user = await userModel
      .aggregate([
        {
          $match: { uuid: uuid }, // Match the document with the specified UUID
        },
        {
          $lookup: {
            from: "roles", // The "roles" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "roles",
          },
        },
        {
          $lookup: {
            from: "permissions", // The "permissions" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "permissions",
          },
        },
      ])
      .exec();

    if (user.length === 0) {
      return res.json({
        status: false,
        error: " this user does not exist in db",
      });
    }
    const userRole =
      user[0].roles[0].roles.findIndex((role) => role === "user") >= 0;
    const userPermission =
      user[0].permissions[0].permissions.findIndex(
        (per) => per === "download"
      ) >= 0;

    if (user && userRole && userPermission) {
      let result = await dataModel.findOne(
        { uuid: uuid },
        { details: { $elemMatch: { id: id } } }
      );
      if (result) {
        if (result.details.length === 0) {
          res.json({ status: false, error: "no files uploaded" });
        } else {
          let fullpath = path.normalize(__dirname + "/..");
          fullpath = path.join(fullpath, "files", result.details[0].path);

          const fileExtension = path.extname(fullpath);
          res.download(fullpath);
        }
      } else {
        res.json({ status: false, error: "user does not exist" });
      }
    } else {
      res.json({
        status: false,
        error: "You don't have permission to download!!!",
      });
    }
  },
  // async uploadsuccess(req, res) {
  //   const uuid = req.params.uuid;
  //   let result = await uploadschema.findOne({ uuid: uuid });

  //   if (result && result.uuid) {
  //     return res.render("download", {
  //       link: `https://upload1-hhaj.onrender.com/download/${result.uuid}`,
  //       time: result.expireIn,
  //     });
  //   }
  //   res.json({status:false,error:"File did not uploaded!!!"});
  // },
  // downloadtext(req, res) {
  //   let fullpath = path.normalize(__dirname + "/..");
  //   fullpath = path.join(fullpath, "logs", "logs.txt");
  //   res.download(fullpath);
  // },
  // subscribe(req, res) {
  //   const subscription = req.body;
  //   // Store the subscription details in your database for future use
  //   console.log(subscription);
  //   res.status(201).json({});
  // },
  async shareableLinkdownload(req, res) {
    const token = req.params.token;
    const id = req.params.id;
    const tokeninfo = compareToken(token);
    if (tokeninfo.status) {
      let result = await dataModel.findOne(
        { uuid: tokeninfo.decode.uuid },
        { details: { $elemMatch: { id: id } } }
      );
      if (result) {
        if (result.details.length === 0) {
          res.json({ status: false, error: "No file exist" });
        } else {
          if (!result.details[0].isShareable) {
            return res.json({
              status: false,
              error: "You are not allowed to download this file!!!",
            });
          }
          let fullpath = path.normalize(__dirname + "/..");
          fullpath = path.join(fullpath, "files", result.details[0].path);
          res.download(fullpath);
        }
      } else {
        res.json({
          status: false,
          exist: "user does not exist or files are not available",
        });
      }
    } else {
      res.json({ status: false, token: "Invalid Token" });
    }
  },
  async getFiles(req, res) {
    // const decodedtoken = req.decode;
    // let result = await uploadschema.findOne({ uuid: decodedtoken.uuid });
    // if (result) {
    //   if (result.details.length === 0) {
    //     res.json({status:false,error:"file does not exist" });
    //   } else {
    //     res.json({status:true, result: result.details});
    //   }
    // } else {
    //   res.json({status:false,error:"file does not exist" });
    // }
    const decodedtoken = req.decode;
    //  if it is admin  then allow access of users
    const user = await userModel
      .aggregate([
        {
          $match: { uuid: decodedtoken.uuid }, // Match the document with the specified UUID
        },
        {
          $lookup: {
            from: "roles", // The "roles" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "roles",
          },
        },
        {
          $lookup: {
            from: "permissions", // The "permissions" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "permissions",
          },
        },
        {
          $lookup: {
            from: "filedatas", // The "permissions" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "filedatas",
          },
        },
      ])
      .exec();

    if (user.length === 0) {
      return res.json({
        status: false,
        error: "this USER does not exist in db",
      });
    }
    const adminRole =
      user[0].roles[0].roles.findIndex((role) => role === "user") >= 0;
    const adminPermission =
      user[0].permissions[0].permissions.findIndex((per) => per === "view") >=
      0;

    if (user && adminRole && adminPermission) {
      res.json({
        status: true,
        result: user[0].filedatas[0]?.details,
        user: user[0],
      });
    } else {
      res.json({ status: false, error: "u  do not have permission to view" });
    }
  },
  async generate(req, res) {
    let id = req.params.id;
    const decodedtoken = req.decode;
    const user = await userModel
      .aggregate([
        {
          $match: { uuid: decodedtoken.uuid }, // Match the document with the specified UUID
        },
        {
          $lookup: {
            from: "roles", // The "roles" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "roles",
          },
        },
        {
          $lookup: {
            from: "permissions", // The "permissions" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "permissions",
          },
        },
      ])
      .exec();
    if (user.length === 0) {
      return res.json({
        status: false,
        error: " this user does not exist in db",
      });
    }
    const userRole =
      user[0].roles[0].roles.findIndex((role) => role === "user") >= 0;
    const userPermission =
      user[0].permissions[0].permissions.findIndex(
        (per) => per === "shareable"
      ) >= 0;

    if (user && userRole && userPermission) {
      let updatedIsShareable = await dataModel.findOneAndUpdate(
        { uuid: decodedtoken.uuid, "details.id": id },
        { $set: { "details.$.isShareable": true } },
        { new: true }
      );
      res.json({ status: true, result: updatedIsShareable });
    } else {
      res.json({
        status: false,
        error: "You are not allowed to generate shareable link",
      });
    }
  },
  async Delete(req, res) {
    const id = req.params.id;
    const decodedtoken = req.decode;
    //  if it is admin  then allow access of users
    const user = await userModel
      .aggregate([
        {
          $match: { uuid: decodedtoken.uuid }, // Match the document with the specified UUID
        },
        {
          $lookup: {
            from: "roles", // The "roles" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "roles",
          },
        },
        {
          $lookup: {
            from: "permissions", // The "permissions" collection name
            localField: "uuid",
            foreignField: "uuid",
            as: "permissions",
          },
        },
      ])
      .exec();

    if (user.length === 0) {
      return res.json({
        status: false,
        error: "this USER does not exist in db",
      });
    }
    const adminRole =
      user[0].roles[0].roles.findIndex((role) => role === "user") >= 0;
    const adminPermission =
      user[0].permissions[0].permissions.findIndex((per) => per === "delete") >=
      0;

    if (user && adminRole && adminPermission) {
      // Match the details object with the specified id
      const result1 = await dataModel.findOne({"details.id": id });
      let partialpath = path.normalize(__dirname + "/..");
      let fullPath = path.join(partialpath, "files",result1.details[0].path);
      fs.unlink(fullPath, (err) => {
        if (err) console.log(err);
      });

      const result = await dataModel.updateOne(
        { "details.id": id },
        { $pull: { details: { id: id } } }
      );

      if (result) {
        res.json({ status: true });
      } else {
        res.json({ status: false, error: "not found!!!" });
      }
    } else {
      res.json({ status: false, error: "u  do not have permission to view" });
    }
  },
  async logout(req, res) {
    const uuid = req.decode.uuid;
    const result = await userModel.findOneAndUpdate(
      { uuid: uuid },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!result) return res.json({ status: false, error: "error in logout" });
    return res.json({ status: true, result: result });
  },
  async sendResetEmail(req,res)

  {
      // first check the email in db , (exist or not) if not return from that point !!
     const {error}=  emailValidate().validate({email:req.body.email})   
     if(error)
     return res.json({status:false,error:error.details[0].message})
    const isExist=await userModel.findOne({email:req.body.email},{uuid:1,email:1,name:1});
    if(!isExist)
    return res.json({status:false,error:"Invalid email!!!"})   
// checking if a user have the permission to reset the password!!
    const role = await rolesModel.findOne({ uuid: isExist.uuid });
    const permission = await permissionModel.findOne({
      uuid:isExist.uuid,
    });
    if (!role)
      return res.json({
        status: false,
        error: "this user do not exist in db with roles",
      });
    if (!permission)
      return res.json({
        status: false,
        error: "does not exist user with permission",
      });
    const isUser = role.roles.includes("user") || role.roles.includes("admin");
    const isPermission = permission.permissions.includes("reset-password");

    if (!isUser || !isPermission)
      return res.json({ status: false, error: "not allowed to reset password!!!" });

      const newGeneratedToken= generateToken({uuid:isExist.uuid})
      mail({to:isExist.email,subject:"Reset Your password",link:`${process.env.BACKEND_URL}reset/password/${isExist.name}/${newGeneratedToken}`});
      res.json({status:true,result:"Check your mail to reset password!!!"})
  },
  async resetPassword(req,res)
  {   const token = compareToken(req.params.token)
      if(!token.status)
      return res.render("revoked");
      const isRevoked= await revokedtokenModel.findOne({token:req.params.token});
      if(isRevoked)
      return res.render('revoked');
      res.render("form",{token:req.params.token})
      
  },
async reset(req,res){
   const status=compareToken(req.body.token);
   if(!status.status)
   return res.json({status:false,error:"token is invalid!!!"});
   const isRevoked= await revokedtokenModel.findOne({token:req.body.token});
      if(isRevoked)
      return res.json({status:false,error:"sorry reset password link is expired , try to make new request!!!"});
      const {error,value}=passwordValidate().validate({password:req.body.password.trim()})   
      if(error)
      return res.json({ status: false, error: error.details[0].message });
       
  const hp= hashpassword(req.body.password.trim())
  const result = await userModel.updateOne({uuid:status.decode.uuid},{$set:{password:hp}});
  if(result.modifiedCount>0)  
 {
  const revokedToken= await revokedtokenModel({uuid:status.decode.uuid,token:req.body.token});
   await revokedToken.save();
  res.json({status:true})
 }
  else
  res.json({status:false,error:"password not changed!!!"});


}
};  

module.exports = usercontroller;
