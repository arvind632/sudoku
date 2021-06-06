const {getUserByEmail} = require("./players.service");
const {genSaltSync,hashSync,compareSync} = require("bcrypt");
const {sign,create} = require("jsonwebtoken");

module.exports = {
    
    login:(req,res) => {
        const body = req.body;
        console.log("------Body---------", body);
        console.log("Email : ", body.email);

        var email = req.body.email;
        var password = req.body.password;
        const errors = {};

        if (!req.body.email) {
            errors.email = ['The email is required'];
        }

        if (!req.body.password) {
            errors.password = ['The password is required'];
        }

        if (Object.keys(errors).length > 0) {
            res.send({
                status: 'failed',
                validation_error: errors,
            })
        }

        else{
            getUserByEmail(body.email,(err,results)=>{
                if(err){
                    return res.status(500).json({
                        status:0,
                        message:"Database connection error !"+err
                    });  
                } 
                else{
                    if(!results){
                        return res.status(200).json({
                            status:0,
                            message:"Invalid Email Or Password !"
                        });  
                    }
                    else{
                        const result = compareSync(body.password,results.password);
                        if(result){
                             
                             const jsonToken = sign({result:results},'SECRET',{
                                    expiresIn:'60000'
                             });
                             
                             console.log("token", jsonToken);
                              req.session.login = true;

                            /*
                            return res.status(200).json({
                                        status:1,
                                        message:"login Successfully",
                                        //token:jsonToken,
                            });
                            */
                            return  res.redirect('/game');

                        }
                        else{
                            return res.status(200).json({
                                status:0,
                                message:"Invalid Email Or Password !"
                            }); 
                        }
                    }
                }
            });

        }
    },

    updateGame:(req,res) =>{
        const body = req.body.data;

        const errors = {};

        if (!req.body.playerId) {
            errors.playerId = ['The player is required'];
        }

        if (!req.body.gameID) {
            errors.gameId = ['The gameId is required'];
        }

        if (!req.body.gameData) {
            errors.gameData = ['The game Data is required'];
        }

        if (Object.keys(errors).length > 0) {
            res.send({
                status: 'failed',
                validation_error: errors,
            })
        }

        else{
            
            updateGame(body,(err,results)=>{
                if(err)
                {
                    return res.status(500).json({
                        status:0,
                        message:"Database connection error !"+err
                    });
                }
                else{
                    return res.status(200).json({
                        status:1,
                        data:results,
                        message:"Record Update Successfully"
                    });

                }
            });
        }
    },



    
}