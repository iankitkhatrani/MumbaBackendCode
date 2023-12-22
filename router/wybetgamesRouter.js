const express = require('express');
const router = express.Router();
const wybetgamesControl = require("../controller/integrationController/wybetgamesControl");

router.post("/authenticate",wybetgamesControl.authenticate)
router.post("/debit",wybetgamesControl.debit)
router.post("/credit",wybetgamesControl.credit)
router.post("/getbalance",wybetgamesControl.getbalance)

module.exports = router;
