const express = require('express');
const router = express.Router();
const mojosgamescontroller = require("../controller/integrationController/mojosController");

router.post("/authentication",mojosgamescontroller.hash_check,mojosgamescontroller.authenticate)

router.post("/debit",mojosgamescontroller.hash_check,mojosgamescontroller.debit)
router.post("/credit",mojosgamescontroller.hash_check,mojosgamescontroller.credit)

router.post("/delayedDebit",mojosgamescontroller.hash_check,mojosgamescontroller.delayedDebit)
router.post("/delayedCredit",mojosgamescontroller.hash_check,mojosgamescontroller.delayedCredit)

router.post("/getbalance",mojosgamescontroller.hash_check,mojosgamescontroller.getbalance)
router.post("/status",mojosgamescontroller.hash_check,mojosgamescontroller.status)
router.post("/rollback",mojosgamescontroller.hash_check,mojosgamescontroller.rollback)
router.post("/resolve",mojosgamescontroller.hash_check,mojosgamescontroller.resolve)
router.post("/offlinecredit",mojosgamescontroller.hash_check,mojosgamescontroller.offlinecredit)
 
module.exports = router;