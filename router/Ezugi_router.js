const express = require('express');
const router = express.Router();
const ezugigamescontroller = require("../controller/integrationController/ezugigamescontroller");

router.post("/authentication",ezugigamescontroller.hashcheck,ezugigamescontroller.authentication)
router.post("/debit",ezugigamescontroller.hashcheck,ezugigamescontroller.debit)
router.post("/credit",ezugigamescontroller.hashcheck,ezugigamescontroller.credit)
router.post("/rollback",ezugigamescontroller.hashcheck,ezugigamescontroller.rollback)

module.exports = router;