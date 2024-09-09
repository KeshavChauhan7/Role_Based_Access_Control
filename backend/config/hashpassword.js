const bcrypt = require('bcrypt');
const saltRounds = 10;
module.exports={
  hashpassword(pass){
    const salt = bcrypt.genSaltSync(saltRounds);
    return  bcrypt.hashSync(pass, salt);
  },
  checkpass(pass,hashpass){
   return bcrypt.compareSync(pass, hashpass); 
  }

}