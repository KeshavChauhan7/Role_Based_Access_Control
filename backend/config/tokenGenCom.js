const jwt = require('jsonwebtoken');

const SECRET = 'IHOPEYOUGOTSAMETOKEN@2327';
const generateToken = (body)=>{
    const token = jwt.sign({uuid:body.uuid},SECRET,{
        
        expiresIn:'1d',

    });
    return token;
}

const compareToken = (tokenId)=>{
    try
    {
        let decode = jwt.verify(tokenId, SECRET);
        if(decode && decode.uuid){
                return {status:true,decode:decode};
        }
        return {status:false};
    }
    catch(err)
    {   
        return {status:false}
    }
   
    

}
module.exports = {generateToken, compareToken};