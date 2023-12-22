const express = require('express');
const router = express.Router();
const RummyslotsControl = require("../controller/integrationController/rummyslotscontroller");

router.post("/authenticate",RummyslotsControl.authenticate)
router.post("/debit",RummyslotsControl.debit)
router.post("/credit",RummyslotsControl.credit)
router.post("/getbalance",RummyslotsControl.getbalance)

module.exports = router;