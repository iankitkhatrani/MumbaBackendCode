const express = require('express');
const router = express.Router();
const jiligamesCon = require("../controller/integrationController/jiligamescontroller");

router.post("/auth",jiligamesCon.auth)
router.post("/bet",jiligamesCon.bet)
router.post("/cancelbet",jiligamesCon.cancelbet)

module.exports = router;