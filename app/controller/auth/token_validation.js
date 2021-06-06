const { verify } = require("jsonwebtoken");

module.exports = {
    checkToken:(req,res,next) =>{
        const token = req.headers['x-access-token'];
        if(token){
            //check token 
            verify(token,process.env.JWT_SECRET,(err,decoded)=>{
                if(err){
                    return res.status(401).json({
                        status:0,
                        message:"Invalid Token",
                    });  
                }
                else{
                    next();
                }
            });
        }   
        else{
            return res.status(401).send(
                {
                    auth: false,
                    status:0,
                    message: 'Access Denied ! unautorized user'
                }
            );
        }
    }
}