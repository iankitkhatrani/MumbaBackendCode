const express = require('express');
const router = express.Router();
const sportsController = require("../controller/integrationController/sportsController");

router.post("/authentication",sportsController.Authenticate)
 
module.exports = router;