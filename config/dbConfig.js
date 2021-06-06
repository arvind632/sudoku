var mysql      = require('mysql');
var dbConnection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'gcube_sudoku'
});
dbConnection.getConnection(function(err){

if(!err) {
    console.log("Database is connected ... ");
} else {
    console.log("Error connecting database ... ", err);
}

});

module.exports = dbConnection;
