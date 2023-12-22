const express = require('express');
const router = express.Router();
const betGamesController = require("../controller/integrationController/betgamesController");

// router.post(BetgamesConfig.authenticate,betGamesController.authenticate)
router.post("/",betGamesController.betgames_api)


module.exports = router;