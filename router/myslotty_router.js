const express = require('express');
const router = express.Router();
const MyslottyController = require("../controller/integrationController/myslottyController");

router.post("/",MyslottyController.check_hash,MyslottyController.myslotty_api)

module.exports = router;