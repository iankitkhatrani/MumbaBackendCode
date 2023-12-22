const express = require('express');
const router = express.Router();
const AegamesCon = require("../controller/integrationController/aegamescontroller");

router.post("/single/wallet/fund/transfer", AegamesCon.walletfundtransfer)
router.post("/single/wallet/fund/query", AegamesCon.walletfundquery)
router.post("/single/wallet/balance", AegamesCon.walletbalance)

module.exports = router;