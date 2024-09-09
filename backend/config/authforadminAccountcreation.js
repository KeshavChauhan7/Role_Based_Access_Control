module.exports=function (req,res,next){
    const secret= req.params.secret
    if(secret===process.env.SECRETFORADMIN)
    {
        next()
    }
    else
    {
        return res.json({error:"You cannot create admin account"})
    }

}