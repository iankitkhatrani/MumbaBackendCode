const express = require('express');
const router = express.Router();
const Xpress_Controll = require("../controller/integrationController/xpressgameController")

router.post("/login", Xpress_Controll.config, Xpress_Controll.login_api)
router.post("/balance",Xpress_Controll.config, Xpress_Controll.balance_api)
router.post("/debit",Xpress_Controll.config, Xpress_Controll.debit_api)
router.post("/credit",Xpress_Controll.config, Xpress_Controll.credit_api)
router.post("/rollback",Xpress_Controll.config, Xpress_Controll.rollback_api)
router.post("/logout",Xpress_Controll.config, Xpress_Controll.logout_api)

module.exports = router;