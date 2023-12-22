const express = require('express');
const router = express.Router();
const testcon = require("../controller/integrationController/testcontrol");

router.post("/api",testcon.api)
 
module.exports = router;