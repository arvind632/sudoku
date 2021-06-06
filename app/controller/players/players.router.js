const { login,updateGame } = require("./players.controller");
const router = require("express").Router();
const  { checkToken } = require("../auth/token_validation");

router.post("/login", login);
router.post("/updateGame", updateGame);

module.exports = router;
