const express = require('express');
const router = express.Router();
const evoplaygamesController = require("../controller/integrationController/evoplaycontroller");

router.post("/",evoplaygamesController.api)

module.exports = router;