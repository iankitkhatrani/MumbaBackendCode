const express = require('express');
const router = express.Router();
const virtualControl = require("../controller/integrationController/virtualgamescontroller");

router.post("/debit",virtualControl.debit)
router.post("/credit",virtualControl.credit)
router.post("/getbalance",virtualControl.getbalance)

module.exports = router;

// testing => 
//  https://starkasino.io/virtualgames/
//                      /debit
//                      /credit
//                      /getbalance
