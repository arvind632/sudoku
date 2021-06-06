let express = require('express')
let app = express()
var session = require('express-session')

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));


var router = express.Router()
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

const  { checkToken } = require("./app/controller/auth/token_validation");




app.use(express.static(__dirname + '/public'));

const playerRouter = require("./app/controller/players/players.router");
app.use('/api',router);
app.use('/api/players',playerRouter);





var auth = function(req, res, next) {
  if (req.session.login)
    return next();
  else
    return res.sendStatus(401);
};


app.get('/login', function(req,res){
	res.sendFile(__dirname + '/view/login.html');
})


// Logout endpoint
app.get('/logout', function (req, res) {
  req.session.destroy();
  // res.send("logout success!");
  res.redirect('/login');
});


app.get('/game',auth, function(req,res){
	res.sendFile(__dirname + '/view/game/index.html');
})

app.get('/dashboard',auth, function (req, res) {
	res.send("Dashboard");
});


var port = process.env.PORT || 4000;
app.listen(port);
console.log("API running at = " + port);

