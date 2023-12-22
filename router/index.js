const express = require('express');
const router = express.Router();
const betGamesController = require("../controller/integrationController/betgamesController");

const Xpress_router = require("./xpress_roter");
const Betsoft_router = require("./Betsoft_router");
const Ezugi_router = require("./Ezugi_router");
const Vivo_router = require("./Vivo_router");
const Wac_router = require("./Wac_router");
const Evoplay_router = require("./Evoplay_router");
const Xpg_router = require("./Xpg_router");
const BetGames_router = require("./betgame_router");
const MySlotty_router = require("./myslotty_router");
const WinnerPoker_router = require("./winnerpoker_router");
const Mojosgames7_router = require("./mojosgames7");
const Sports_router = require("./sports_router");
const rummyslotsRouter = require("./rummyslotsRouter");
const jiligamesRouter = require("./jiligamesRouter");
const aegamesRouter = require("./aegamesRouter");
const virtualgamesRouter = require("./virtualgames");
const testRouter = require("./test");
const wybetgamesRouter = require("./wybetgamesRouter");

router.use("/xpggames", Xpg_router);//xpg
router.use("/prodbetsoftgames", Betsoft_router);//betsoft
router.use("/ezugigames", Ezugi_router);//ezugi
router.use("/vivogame", Vivo_router);//vivo
router.use("/wacplay", Wac_router)//wac
router.use("/evoplay", Evoplay_router);//evoplay
router.use("/xpressgame", Xpress_router);//evoplay
router.use("/betgames", betGamesController.check_hash, BetGames_router);
router.use("/myslotty", MySlotty_router);//evoplay
router.use("/winnerpoker", WinnerPoker_router);//winner
router.use("/mojosgames7", Mojosgames7_router);//winner
router.use("/sports", Sports_router);//winner

router.use("/rummyslots", rummyslotsRouter);//winner
router.use("/jiligames", jiligamesRouter);//jiligames
router.use("/aegames", aegamesRouter);//aegames
router.use("/virtualgames", virtualgamesRouter);// 

router.use("/testrouter", testRouter);// 
router.use("/wybetgames", wybetgamesRouter);// wy bet games

module.exports = router;