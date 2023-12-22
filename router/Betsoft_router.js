const express = require('express');
const router = express.Router();
const BetSoftConfig = require("../servers/provider.json").betsoft;
const betsoftController = require("../controller/integrationController/betsoftController");

router.post(BetSoftConfig.authenticate,betsoftController.authenticate)
router.post(BetSoftConfig.account,betsoftController.account)
router.post(BetSoftConfig.betresult,betsoftController.betresult)
router.post(BetSoftConfig.refundBet,betsoftController.refundBet)
router.post(BetSoftConfig.getBalance,betsoftController.getBalance)
router.post(BetSoftConfig.getAccountInfo,betsoftController.getAccountInfo)
router.post(BetSoftConfig.bonusWin,betsoftController.bonusWin)
router.post(BetSoftConfig.bonusRelease,betsoftController.bonusRelease)

module.exports = router;