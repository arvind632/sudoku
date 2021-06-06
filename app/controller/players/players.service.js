const dbConnection = require("../../../config/dbConfig");
module.exports = {
    getUserByEmail:(email,callBack) =>{
        dbConnection.query("SELECT * FROM players WHERE email=?",[email],(error,results)=>{
            if(error){
                console.log("Get query", error);
                return callBack(error);
            }
            return callBack(null,results[0]);
        });
    },

    updateGame:(data,callBack) => {
        dbConnection.query('update games SET ? WHERE gameNo=?', [record,data.gameNo], (error,results)=>{
                    if(error){
                        return callBack(error);
                    }
                    let result = {
                        success: true,
                        data:results,
                        message:"Game save Successfully"
                    };
                    return callBack(null,result);
        });
    },
}



/*
function getQueryData(query){
    return new Promise(function (resolve,reject){
        dbConnection.query(query, (error, result) => {
             if(!error){                
                resolve(result);
            }
        });
    })
}
*/
