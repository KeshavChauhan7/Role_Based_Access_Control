// const permissionModel = require("../db/Model/permissionModel");
// const rolesModel = require("../db/Model/rolesModel");
// const userModel = require("../db/Model/userModel");
// module.exports=async function(req,res,next){
//     const permission=req.route.path.split("/")[1]
//     const decodedtoken = req.decode;
//     const user = await userModel
//       .aggregate([
//         {
//           $match: { uuid: decodedtoken.uuid }, // Match the document with the specified UUID
//         },
//         {
//           $lookup: {
//             from: "roles", // The "roles" collection name
//             localField: "uuid",
//             foreignField: "uuid",
//             as: "roles",
//           },
//         },
//         {
//           $lookup: {
//             from: "permissions", // The "permissions" collection name
//             localField: "uuid",
//             foreignField: "uuid",
//             as: "permissions",
//           },
//         },
//       ])
//       .exec();

//     if (user.length === 0) {
//       return res.json({
//         status: false,
//         error: " this User does not exist in db",
//       });
//     }
   
//     const userRole =
//       user[0].roles[0].roles.findIndex((role) => role === "user") >= 0;
//     const userPermission =
//       user[0].permissions[0].permissions.findIndex((per) => per === permission) >=
//       0;

//     if (user && userRole && userPermission) {
//         req.uuid=decodedtoken.uuid;
//         next();
//     }
//     else
//     return res.json({status:false,error:`You are not allowed for ${permission}`})
// }