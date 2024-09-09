const nodemailer =require("nodemailer")

module.exports = function (body){
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS:true, // true for 465, false for other ports
        auth: {
          user: process.env.user,
          pass:process.env.password 
        },
      });
    var mailOptions ={
      from:"hariomarya305@gmail.com",
      to:body.to,
      subject:body?.subject || "Verify your account" ,
      text:body.link
    }
    
    transporter.sendMail(mailOptions,(err,info)=>{
      if(err)
      {
        console.log(err)
      }
      else
       {
        console.log("send!!!")
       }
    })
}
