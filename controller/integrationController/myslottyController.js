const BASECONTROL = require("./../basecontroller");
const CONFIG = require("../../servers/provider.json");
const url = require('url');
const Crypto = require("crypto");
const LAUNCHURL = "8";
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
const gamesessionmodel = require("../../models/users_model").gamesessionmodel;
var mongoose = require('mongoose');
const MySlottyCOn = CONFIG.MySlotty;

async function player_balanceupdatein(amount, userId, wallets) {
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount, userId, wallets);
    if (!outdata) {
        return false;
    } else {
        return (outdata * 100).toFixed(0);
    }
}

async function hash_verify(indata) {


    let con = await BASECONTROL.getCredentialFunc("MrSlottYCreential")
    if (con) {

        var paramstring = "";
        var hash = indata.hash;
        Object.keys(indata).sort().forEach(function (v, i) {
            if (v != "hash") {
                paramstring += v + "=" + encodeURIComponent(indata[v]) + "&";
            }
        });
        var haststring = paramstring.slice(0, paramstring.length - 1);
        var hash1 = Crypto.createHmac("sha256", con.HMACsalt).update(haststring).digest("hex");
        if (hash1 == hash) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function urlparse(req) {
    var q = url.parse(req.url, true);
    var qdata = q.query;
    return qdata;
}

exports.check_hash = async (req, res, next) => {
    var indata = urlparse(req);
    console.log(req.url);
    req.body.currency = await BASECONTROL.getCurrency();
    var hash_bool = await hash_verify(indata);
    if (hash_bool) {
        req.body = indata;
        next();
    } else {
        console.log("------ffffffffff---------")
        res.json({ "status": 401, "error": { "code": "ERR006", "message": "Unauthorized request.", "display": false, "action": "restart" } });
    }
}

exports.myslotty_api = async (req, res, next) => {

    var indata = req.body;
    var action = indata.action;
    var currency = indata.currency;
    // var account = await BASECONTROL.BfindOne(playersUser,{id : indata.player_id});
    var account = await BASECONTROL.playerFindByid(indata.player_id);
    if (account) {
        if (currency != "invalid_playerid") {
            let ses = await BASECONTROL.BfindOne(gamesessionmodel, {id: indata.player_id})
            if (ses) {
                console.log("---session true")
            } else {
                console.log("---session false")
            }

            switch (action) {
                case "balance":
                    this.balance(req, res, next, account);
                    break;
                case "bet":
                    this.bet(req, res, next, account);
                    break;
                case "win":
                    this.win(req, res, next, account);
                    break;
                case "bet_win":
                    this.bet_win(req, res, next, account);
                    break;
                case "cancel_bet_win":
                    this.cancel_bet_win(req, res, next, account);
                    break;
                case "cancel":
                    this.cancel(req, res, next, account);
                    break;
            }
        } else {
            res.json({ "status": 500, "error": { "code": "ERR008", "message": "Unsupported currency.", "display": true, "action": "restart" } });
            return next();
        }
    } else {
        res.json({ "status": 500, "error": { "code": "ERR005", "message": "Player authentication failed.", "display": true, "action": "restart" } });
        return next();
    }
}

exports.balance = async (req, res, next, userdata) => {
    res.json({ "status": 200, "balance": (userdata.balance * 100).toFixed(0), "currency": req.body.currency });
    return next();
}

exports.bet_win = async (req, res, next, userdata) => {
    var indata = req.body;
    var balance = userdata.balance;
    var game_id = indata.game_id;
    var betamount = parseInt(indata.amount) / 100;
    var winamount = parseInt(indata.win) / 100;
    var player_id = indata.player_id;
    var lastwin = await is_exist_lastwin(indata.win_transaction_id, userdata.id, "WIN");
    if (!lastwin) {
        var lastbet = await is_exist_lastbet(indata.bet_transaction_id, userdata.id, "BET");
        if (!lastbet) {
            console.log(game_id, "-game_id-")
            var gameId = await BASECONTROL.get_gameid(LAUNCHURL, game_id);
            if (!gameId) {
                res.json({ "status": 500, "error": { "code": "ERR001", "message": "Unknown error occurred.", "display": true, "action": "restart" } });
                return next();
            }
            if (balance >= (betamount - winamount)) {
                var betdata = Object.assign({},
                    { bet_transaction_id: indata.bet_transaction_id },
                    { prevbalance: balance },
                );


                var betrow = {
                    AMOUNT: betamount,
                    LAUNCHURL: LAUNCHURL,
                    TYPE: "BET",
                    userid: mongoose.Types.ObjectId(player_id),
                    betting: betdata,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                    roundId: indata.bet_transaction_id,
                    transactionId: indata.bet_transaction_id,
                };

                console.log(betrow, "-betrow---")

                var wallets_ = {
                    commission: 0,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    status: "BET",
                    userid: mongoose.Types.ObjectId(player_id),
                    roundid: indata.bet_transaction_id,
                    transactionid: indata.bet_transaction_id,
                    lastbalance: balance,
                    credited: 0,
                    debited: betamount
                }

                await BASECONTROL.data_save(betrow, betting_historymodel);
                var updatehandle = await player_balanceupdatein(betamount * -1, player_id, wallets_);

                var windata = Object.assign({},
                    { prevbalance: updatehandle / 100 },
                    { win_transaction_id: indata.win_transaction_id }
                );


                var realamount = 0 
                var commamount = 0
                if (winamount > 0) {
                    var {realamount, commamount} = await BASECONTROL.getWinningComission(winamount)
                } else {
                }


                // var gameId = await BASECONTROL.get_gameid(LAUNCHURL,game_id);
                var winrow = {
                    AMOUNT: realamount,
                    LAUNCHURL: LAUNCHURL,
                    TYPE: "WIN",
                    userid: mongoose.Types.ObjectId(player_id),
                    betting: windata,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                    roundId: indata.bet_transaction_id,
                    transactionId: indata.bet_transaction_id,
                    commission: commamount
                };

                var wallets_1 = {
                    commission: commamount,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    status: "WIN",
                    userid: mongoose.Types.ObjectId(player_id),
                    roundid: indata.win_transaction_id,
                    transactionid: indata.win_transaction_id,
                    lastbalance: balance,
                    credited: realamount,
                    debited: 0
                }

                await BASECONTROL.data_save(winrow, betting_historymodel);
                updatehandle = await player_balanceupdatein(realamount, player_id, wallets_1);
                if (updatehandle === false) {
                    res.json({ "status": 500, "error": { "code": "ERR001", "message": "Unknown error occurred.", "display": true, "action": "restart" } });
                    return next();

                } else {
                    res.json({ "status": 200, "balance": updatehandle, "currency": indata.currency });
                    return next();
                }
            } else {
                res.json({ "status": 500, "error": { "code": "ERR003", "message": "Insufficient funds to place current wager. Please reduce the stake or add more funds to your balance.", "display": true, "action": "continue" } });
                return next();
            }
        } else {
            res.json({ "status": 500, "error": { "code": "ERR007", "message": "Duplicate transaction request.", "display": true, "action": "continue" } });
            return next();
        }
    } else {
        res.json({ "status": 500, "error": { "code": "ERR007", "message": "Duplicate transaction request.", "display": true, "action": "continue" } });
        return next();
    }
}

async function is_exist_lastwin(win_transaction_id, userId, type) {
    var outdata = null;
    await betting_historymodel.findOne({ $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: type }, { userid: mongoose.Types.ObjectId(userId) }, { "betting.win_transaction_id": win_transaction_id }] }).then(rdata => {
        if (!rdata) {
            outdata = false;
        } else {
            outdata = rdata;
        }
    });
    return outdata;
}

async function is_exist_lastbet(bet_transaction_id, userId, type) {
    var outdata = null;
    await betting_historymodel.findOne({ $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: type }, { userid: mongoose.Types.ObjectId(userId) }, { "betting.bet_transaction_id": bet_transaction_id }] }).then(rdata => {
        if (!rdata) {
            outdata = false;
        } else {
            outdata = rdata;
        }
    });
    return outdata;
}


exports.cancel_bet_win = async (req, res, next, userdata) => {
    var indata = req.body;
    var balance = userdata.balance;
    var game_id = indata.game_id;
    var betamount = parseInt(indata.amount) / 100;
    var winamount = parseInt(indata.win) / 100;
    var player_id = indata.player_id;
    var lastwin = await is_exist_lastwin(indata.win_transaction_id, userdata.id, "CANCELED_BET");
    if (!lastwin) {
        var lastbet = await is_exist_lastbet(indata.bet_transaction_id, userdata.id, "CANCELED_BET");
        if (!lastbet) {
            var lastwin1 = await is_exist_lastwin(indata.win_transaction_id, userdata.id, "WIN");
            if (lastwin1) {
                var lastbet = await is_exist_lastbet(indata.bet_transaction_id, userdata.id, "BET");
                if (lastbet) {
                    var cancelbetamount = (betamount - winamount)
                    var betdata = Object.assign({},
                        { bet_transaction_id: indata.bet_transaction_id },
                        { win_transaction_id: indata.win_transaction_id },
                        { prevbalance: balance },
                    );


                    var gameId = await BASECONTROL.get_gameid(LAUNCHURL, game_id);
                    if (!gameId) {
                        res.json({ "status": 500, "error": { "code": "ERR001", "message": "Unknown error occurred.", "display": true, "action": "restart" } });
                        return next();
                    }
                    var betrow = {
                        AMOUNT: cancelbetamount,
                        LAUNCHURL: LAUNCHURL,
                        TYPE: "CANCELED_BET",
                        userid: mongoose.Types.ObjectId(player_id),
                        betting: betdata,
                        gameid: mongoose.Types.ObjectId(gameId.gameid),
                        providerid: mongoose.Types.ObjectId(gameId.providerid),
                        transactionId: indata.bet_transaction_id,
                        roundId: indata.bet_transaction_id,
                    };
                    console.log(betrow, "-betrow---")

                    var wallets_ = {
                        commission: 0,
                        gameid: mongoose.Types.ObjectId(gameId.gameid),
                        status: "CANCELED_BET",
                        userid: mongoose.Types.ObjectId(player_id),
                        roundid: indata.bet_transaction_id,
                        transactionid: indata.bet_transaction_id,
                        lastbalance: balance,
                        credited: cancelbetamount,
                        debited: 0
                    }

                    await BASECONTROL.data_save(betrow, betting_historymodel);
                    var updatehandle = await player_balanceupdatein(cancelbetamount, player_id, wallets_);
                    if (updatehandle === false) {
                        res.json({ "status": 500, "error": { "code": "ERR001", "message": "Unknown error occurred.", "display": true, "action": "restart" } });
                        return next();

                    } else {
                        res.json({ "status": 200, "balance": updatehandle, "currency": indata.currency });
                        return next();
                    }
                } else {
                    res.json({ "status": 500, "error": { "code": "ERR001", "message": "Unknown error occurred.", "display": true, "action": "restart" } });
                    return next();
                }
            } else {
                res.json({ "status": 500, "error": { "code": "ERR001", "message": "Unknown error occurred.", "display": true, "action": "restart" } });
                return next();
            }
        } else {
            res.json({ "status": 500, "error": { "code": "ERR007", "message": "Duplicate transaction request.", "display": true, "action": "continue" } });
            return next();
        }
    } else {
        res.json({ "status": 500, "error": { "code": "ERR007", "message": "Duplicate transaction request.", "display": true, "action": "continue" } });
        return next();
    }
}



exports.win = async (req, res, next) => {
    var indata = req.body;
}

exports.cancel = async (req, res, next) => {
    var indata = req.body;
}

exports.bet = async (req, res, next) => {
    var indata = req.body;
}

