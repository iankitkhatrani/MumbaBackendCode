const express = require('express');
const router = express.Router();
const WinnerController = require("../controller/integrationController/winnerpokerController");

router.post("/authenticate",WinnerController.authenticate)
router.post("/debit",WinnerController.debit)
router.post("/credit",WinnerController.credit)
router.post("/updateSession",WinnerController.updateSession)

module.exports = router;