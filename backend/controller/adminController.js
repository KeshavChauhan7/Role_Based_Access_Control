const userModel = require("../db/Model/userModel");
const { v4: uuidv4 } = require("uuid");
const permissionModel = require("../db/Model/permissionModel");
const rolesModel = require("../db/Model/rolesModel");
const mail = require("../mail/mail");
const { generateToken, compareToken } = require("../config/tokenGenCom");
const revokedtokenModel = require("../db/Model/revokedTokensModel");
const dataModel = require("../db/Model/dataModel");
const { hashpassword, checkpass } = require("../config/hashpassword");
const {loginValidate,registerValidate, timeupdateValidate} =require("../config/validation")
const path = require("path");
const fs = require("fs");
const adminController = {
  async createUser(req, res) {
    const decodedtoken = req.decode;
      
   const {error,value} =registerValidate().validate({name:req.body.name,email:req.body.email,password:req.body.password})  ;
   if(error)
   return res.json({ status: false, error: error.details[0].message });
    const result = await userModel // joins of userModel, rolesModel , permissionsModel based on uuid
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

    if (result.length === 0) {
      return res.json({ status: false, error: "Admin does not exist in db" });
    }
    const adminRole =
      result[0].roles[0].roles.findIndex((role) => role === "admin") >= 0;
    const adminPermission =
      result[0].permissions[0].permissions.findIndex(
        (per) => per === "create"
      ) >= 0;

    if (result && adminRole && adminPermission) {
      // check if a user exist with same name or same email
      const result = await userModel
        .findOne({ $or: [{ name: value.name.trim() }, { email: value.email.trim()}] })
        .exec();
      if (!result) {
        let uuid = uuidv4();
        try {
          const hashpass = hashpassword(value.password.trim());
          let user = await userModel({
            name: value.name.trim(),
            email: value.email.trim(),
            password: hashpass,
            uuid: uuid,
          });
          user = await user.save();
          let permissions = await permissionModel({
            uuid: uuid,
            permissions: req.body.permissions,
          });
          permissions = await permissions.save();

          let roles = await rolesModel({
            uuid: uuid,
            roles: req.body.roles,
          });
          roles = await roles.save();

          // dataModel is not added , during upation can be handle this
          res.json({
            status: true,
            roles: roles,
            permissions: permissions,
            user: user,
          });
        } catch (e) {
          res.json({
            status: false,
            error: "something is wrong during creation of user",
          });
        }
      } else {
        res.json({ status: false, error: "try different name and email" });
      }
    } else {
      res.json({
        status: false,
        error: `you dont have permission ${result[0]?.name}`,
      });
    }
  },
  async createadminAccount(req, res) {
    const body = req.body;
    const {error,value} = registerValidate().validate(req.body);
    if(error)
    return res.json({ status: false, error: error.details[0].message });

    const result = await userModel
      .findOne({ $or: [{ name: value.name.trim() }, { email: value.email.trim() }] })
      .exec();
    if (result && result.name) {
      res.json({ status: false, error: "Try different email and name" });
    } else {
      try {
        let uuid = uuidv4();
        const hashpass = hashpassword(value.password.trim());
        let user = await userModel({
          uuid: uuid,
          name: value.name.trim(),
          email: value.email.trim(),
          password: hashpass,
          isAdmin: true,
        });
        user = await user.save();
        const token = generateToken({ uuid: uuid });
        mail({
          to: value.email.trim(),
          link: `${process.env.BACKEND_URL}admin/verify/${process.env.SECRETFORADMIN}/${token}`,
        });
        res.json({
          status: true,
          result: "check your mail to verify your account",
        });
      } catch (e) {
        res.json({ status: false, error: "error during creation" });
      }
    }
  },
  async verifyAdmin(req, res) {
    const token = req.params.token;
    const tokenInfo = compareToken(token);
    if (!tokenInfo.status) {
      return res.json({ error: "Token is invalid or expired !!!" });
    }
    let revokeFlag = await revokedtokenModel.findOne({
      uuid: tokenInfo.decode.uuid,
    });
    if (revokeFlag) {
      return res.json({ error: "Token is revoked" });
    }

    if (tokenInfo.status) {
      // adding extra check remove this
      try {
        let user = await userModel.updateOne(
          { uuid: tokenInfo.decode.uuid }, // Filter for documents
          { $set: { isVerified: true } }
        );
        let roles = await rolesModel({
          uuid: tokenInfo.decode.uuid,
          roles: ["admin"],
        });
        roles = await roles.save();

        let permission = await permissionModel({
          uuid: tokenInfo.decode.uuid,
          permissions: [
            "view",
            "create",
            "delete",
            "update",
            "deletefile",
            "updatefile",
            "uploadfile",
            "viewfile",
            "download",
            "reset-password"
          ],
        });
        permission = await permission.save();

        res.json({ verified: true });
      } catch (e) {
        res.json({ error: "error during verifying stage" });
      }
    } else {
      res.json({ error: "Token is invalid or expired" });
    }

    let revoke = await revokedtokenModel({
      uuid: tokenInfo.decode.uuid,
      token: token,
    });
    revoke = await revoke.save();
    console.log("revoked");
  },
  async login(req, res) {
    const body = req.body;  
    const  {error,value} =loginValidate().validate(req.body);
    if(error)
    return res.json({ status: false, error: error.details[0].message });
    adminexist = await userModel.findOne({
      $and: [{ name:value.name.trim() }, { isAdmin: true },{isVerified:true}],
    });
    if (!adminexist) {
      return res.json({ status: false, error: "no user exist" });
    }

    if (checkpass(value.password.trim(), adminexist.password)) {
      const user = await userModel.updateOne(
        {
          $and: [
            { name: value.name.trim() },
            { isVerified: true }, // this is because when a person make his account as a admin so he / she must verify the account , if he/she did not verify the account , even the details enter during the registration is saved in the databse but isVerified field is set as false , so without verifying himself, herself can not  login..that's why i use this
          ],
        },
        { $set: { isActive: true } },
        { new: true }
      );

      const token = generateToken({ uuid: adminexist.uuid });
      res.json({ status: true, result: token });
    } else {
      res.json({ status: false, error: "wrong password" });
    }
  },
  async getUsers(req, res) {
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
        error: "this Admin does not exist in db",
      });
    }
    const adminRole =
      user[0].roles[0].roles.findIndex((role) => role === "admin") >= 0;
    const adminPermission =
      user[0].permissions[0].permissions.findIndex((per) => per === "view") >=
      0;

    if (user && adminRole && adminPermission) {
      const users = await userModel.find({ isAdmin: false }).exec();
      res.json({ status: true, result: users });
    } else {
      res.json({ status: false, error: "u are not admin!!!" });
    }
  },
  async getUser(req, res) {
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
        error: "this Admin does not exist in db",
      });
    }
    const adminRole =
      user[0].roles[0].roles.findIndex(
        (role) => role === "admin"
      ) >= 0;
    const adminPermission =
      user[0].permissions[0].permissions.findIndex((per) => per === "view") >=
      0;

    if (user && adminRole && adminPermission) {
      const uniqueUser = await userModel
        .aggregate([
          {
            $match: { uuid: req.params.uuid }, // Match the document with the specified UUID
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

      if (!uniqueUser) {
        return res.json({ status: false, error: "provided uuid is not found" });
      }
      res.json({ status: true, result: uniqueUser });
    } else {
      // not allowed to view
      res.json({ status: false, error: "u  do not have permission to view" });
    }
  },
  // updating a user

  async updateAuser(req, res) {
    //update a user includes userModel,rolesModeland permissionModel
    const decodedtoken = req.decode;
    const {error,value} =registerValidate().validate({name:req.body.name,email:req.body.email,password:req.body.password})  ;
    if(error)
    return res.json({ status: false, error: error.details[0].message });
    const uuid = req.params.uuid;
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
        error: " this Admin does not exist in db",
      });
    }
    const adminRole =
      user[0].roles[0].roles.findIndex((role) => role === "admin") >= 0;
    const adminPermission =
      user[0].permissions[0].permissions.findIndex((per) => per === "update") >=
      0;

    if (user && adminRole && adminPermission) {
      // const existInDB = await userModel.findOne({
      //   $or: [{ name: req.body.name }, { email: req.body.email }],
      // });
      // if (existInDB) {
      //   return res.json({
      //     error: "exist in db try different name and email!!!",
      //   });
      // }

      // const isAdmin = req.body.roles.includes("admin");
      // const isVerified = isAdmin;

      const hashpass = hashpassword(value.password.trim());
      const userUpdated = await userModel.findOneAndUpdate(
        { uuid: uuid },
        {
          $set: {
            name: value.name.trim(),
            email: value.email.trim(),
            password: hashpass,
            // isAdmin: isAdmin,
            // isVerified: isVerified,
          },
        },
        { new: true }
      );
      if (!userUpdated) {
        return res.json({
          status: false,
          error: "error in uuid ,user may not exist",
        });
      }

      const rolesUpdated = await rolesModel.findOneAndUpdate(
        { uuid: uuid },
        {
          $set: {
            roles: req.body.roles,
          },
        },
        { new: true }
      );

      const permissionsUpdated = await permissionModel.findOneAndUpdate(
        { uuid: uuid },
        {
          $set: {
            permissions: req.body.permissions,
          },
        },
        { new: true }
      );

      //  if user will admin so dataModel will be deleted corresponding to its uuid
      // if (isAdmin) {
      //   const data = await dataModel.findOne({ uuid: uuid });
      //   if (data) {
      //     let dataArray = data.details;
      //     let fullpath = path.normalize(__dirname + "/..");

      //     for (let a of dataArray) {
      //       fs.unlink(path.join(fullpath, "files", a.path), (err) => {
      //         if (err) {
      //           res.json({ error: "error in deleting files from server!!!" });
      //         }
      //       });
      //     }
      //     await dataModel.findOneAndDelete({ uuid: uuid });
      //   } else {
      //     res.json({ error: "data not found!!!" });
      //   }

      //   /// rest code is remaining now
      // }
      res.json({
        status: true,
        userUpdated: userUpdated,
        rolesUpdated: rolesUpdated,
        permissionsUpdated: permissionsUpdated,
      });
    } else {
      res.json({ status: false, error: "You are not authorized person" });
    }
  },
  async deleteAuser(req, res) {
    const decodedtoken = req.decode;
    const uuid = req.params.uuid;
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
        error: " this Admin does not exist in db",
      });
    }
    const adminRole =
      user[0].roles[0].roles.findIndex((role) => role === "admin") >= 0;
    const adminPermission =
      user[0].permissions[0].permissions.findIndex((per) => per === "delete") >=
      0;
    if (user && adminRole && adminPermission) {
      try {
        const details = await dataModel.findOne(
          { uuid: uuid },
          { details: 1, _id: 0 }
        );
        const array = details.details;
        let partialpath = path.normalize(__dirname + "/..");
        array.map((e) => {
          let fullPath = path.join(partialpath, "files", e.path);
          fs.unlink(fullPath, (err) => {
            if (err) console.log(err);
          });
        });

        const userDeleted = await userModel.findOneAndDelete({ uuid: uuid });
        if (!userDeleted) {
          return res.json({
            status: false,
            error: "data not found or may uuid mismatch",
          });
        }
        const rolesDeleted = await rolesModel.findOneAndDelete({ uuid: uuid });
        const permissionsDeleted = await permissionModel.findOneAndDelete({
          uuid: uuid,
        });
        const dataDeleted = await dataModel.findOneAndDelete({ uuid: uuid });

        return res.json({
          userDeleted: userDeleted,
          rolesDeleted: rolesDeleted,
          permissionsDeleted: permissionsDeleted,
          dataDeleted: dataDeleted,
          status: true,
        });
      } catch (e) {
        return res.json({
          status: false,
          error: "error in deleting the user!!!",
        });
      }
    } else {
      res.json({
        status: false,
        error: "You dont have permission to delete the user!!!",
      });
    }
  },
  async deleteUsers(req, res) {
    const decodedtoken = req.decode;
    const user = await userModel
      .aggregate([
        {
          // old fashion i will update this code
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
        error: " this Admin does not exist in db",
      });
    }
    const adminRole =
      user[0].roles[0].roles.findIndex((role) => role === "admin") >= 0;
    const adminPermission =
      user[0].permissions[0].permissions.findIndex((per) => per === "delete") >=
      0;

    if (user && adminRole && adminPermission) {
      try {
        const allusersdetails = await dataModel.find(
          {},
          { details: 1, _id: 0 }
        );
        const mergedintoonearray = allusersdetails.flatMap(
          (user) => user.details
        );
        let partialpath = path.normalize(__dirname + "/..");
        mergedintoonearray.map((e) => {
          let fullPath = path.join(partialpath, "files", e.path);
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.log(err);
            }
          });
        });

        const usersToDelete = await userModel.find({ isAdmin: false }); //return array of objects having all users details

        for (const user of usersToDelete) {
          const { uuid } = user;
          await userModel.deleteOne({ uuid });
          await rolesModel.deleteOne({ uuid });
          await dataModel.deleteOne({ uuid });
          await permissionModel.deleteOne({ uuid });
        }
        res.json({ status: true });
      } catch (e) {
        res.json({ status: false, error: "error in deleting docs!!!" });
      }
    } else {
      res.json({
        status: false,
        error: "You are not authorized to delete all users!!!",
      });
    }
  },
  async upload(req, res) {
    let sampleFile;
    let uploadPath;
    const decodedtoken = req.decode;

    const role = await rolesModel.findOne({ uuid: decodedtoken.uuid });
    const permission = await permissionModel.findOne({
      uuid: decodedtoken.uuid,
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
    const isAdmin = role.roles.includes("admin");
    const isPermission = permission.permissions.includes("uploadfile");
    if (!isAdmin || !isPermission) {
      return res.json({
        status: false,
        error: "you are not allowed to upload ",
      });
    }

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
        { uuid: req.params.uuid },
        { $push: { details: newObject } },
        { new: true, upsert: true } // if document is matched with uuid then it will create new one
      );
      res.status(200).json({ status: true, result: result });
    });
  },
  async userfiles(req, res) {
    const decodedtoken = req.decode;
    //  if it is admin  then allow access of users

    const role = await rolesModel.findOne({ uuid: decodedtoken.uuid });
    const permission = await permissionModel.findOne({
      uuid: decodedtoken.uuid,
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
    const isAdmin = role.roles.includes("admin");
    const isPermission = permission.permissions.includes("viewfile");

    if (!isAdmin && !isPermission)
      return res.json({ status: false, error: "not allowed to view file" });

    const result = await dataModel.findOne({ uuid: req.params.uuid });

    if (!result) {
      return res.json({ status: false, error: "no record!!!" });
    }

    res.json({ status: true, result: result.details });
  },
  async updatefile(req, res) {
    const decodedtoken = req.decode;
    const {error,value} = timeupdateValidate().validate(req.body);
    if(error)
    return res.json({ status: false, error: error.details[0].message });
    //  if it is admin  then allow access of users
    const role = await rolesModel.findOne({ uuid: decodedtoken.uuid });
    const permission = await permissionModel.findOne({
      uuid: decodedtoken.uuid,
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
    const isAdmin = role.roles.includes("admin");
    const isPermission = permission.permissions.includes("updatefile");

    if (!isAdmin || !isPermission)
      return res.json({ status: false, error: "not allowed to update file" });

    const currentTime = Math.floor(Date.now() / 1000);

    const timeInDay = parseInt(value.expireIn);
    const updatedexpiretime = timeInDay * 24 * 60 * 60 + currentTime;
    const result = await dataModel.findOneAndUpdate(
      { uuid: req.params.uuid, "details.id": req.params.id },
      { $set: { "details.$.expireIn": updatedexpiretime } },
      { new: true }
    );

    if (!result) {
      return res.json({ status: false, error: "no record!!!" });
    }
    res.json({ status: true, result: result });
  },
  async deletefile(req, res) {
    const decodedtoken = req.decode;
    //  if it is admin  then allow access of users
    const role = await rolesModel.findOne({ uuid: decodedtoken.uuid });
    const permission = await permissionModel.findOne({
      uuid: decodedtoken.uuid,
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
    const isAdmin = role.roles.includes("admin");
    const isPermission = permission.permissions.includes("deletefile");

    if (!isAdmin || !isPermission)
      return res.json({ status: false, error: "not allowed to delete file" });

    const file = await dataModel.findOne(
      { uuid: req.params.uuid, "details.id": req.params.id },
      { "details.$": 1 }
    );

    const fullpath = path.normalize(__dirname + "/..");
    fs.unlink(path.join(fullpath, "files", file.details[0].path), (err) => {
      if (err) {
        res.json({
          status: false,
          error: "error in deleting files from server!!!",
        });
      }
    });

    const result = await dataModel.findOneAndUpdate(
      { uuid: req.params.uuid },
      { $pull: { details: { id: req.params.id } } },
      { new: true }
    );

    if (!result) {
      return res.json({ status: false, error: "no record!!!" });
    }

    res.json({ status: true, result: result });
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
  async download(req, res) {
    const tokenStatus = compareToken(req.params.token);
    if (!tokenStatus.status)
      return res.json({ status: false, error: "token is invalid" });
    const user = await userModel
      .aggregate([
        {
          $match: { uuid: tokenStatus.decode.uuid }, // Match the document with the specified UUID
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
      user[0].roles[0].roles.findIndex((role) => role === "admin") >= 0;
    const userPermission =
      user[0].permissions[0].permissions.findIndex(
        (per) => per === "download"
      ) >= 0;

    if (user && userRole && userPermission) {
      let result = await dataModel.findOne(
        { uuid: req.params.uuid },
        { details: { $elemMatch: { id: req.params.id } } }
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
};

module.exports = adminController;
