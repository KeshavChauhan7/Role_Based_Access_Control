const Joi = require('joi');
module.exports={
    loginValidate(){
           return Joi.object({
            name: Joi.string().required(),
            password: Joi.string().min(6).max(30).required(),
          });
    },
    registerValidate(){
        return Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(6).max(30).required(),
          });
    },
    timeupdateValidate(){
        return Joi.object({
            expireIn:Joi.number().required()
          });
    },
    passwordValidate(){
        return Joi.object({
            password: Joi.string().min(6).max(30).required()
          });
    },
    emailValidate(){
        return Joi.object({
            email: Joi.string().email().required()
          });
    }




}