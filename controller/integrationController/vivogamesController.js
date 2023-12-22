const url = require('url');
const BASECONTROL = require("./../basecontroller");
const o2x = require('object-to-xml');
const CONFIG = require("../../servers/provider.json");
const USERSMODEL = require("../../models/users_model");
const gamesessionModel = USERSMODEL.gamesessionmodel;
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
var mongoose = require('mongoose');
const Gamelist = require("../../models/games_model").GAMELISTMODEL;
const LAUNCHURL = "4";
const passkey = CONFIG.vivo.passkey;

async function player_balanceupdatein(amount, userId, wallets) {
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount, userId, wallets);
    return outdata.toFixed(2);
}

function urlparse(adr) {
    var q = url.parse(adr, true);
    var qdata = q.query;
    return qdata;
}

function get_time() {
    return BASECONTROL.get_time();
}

function XML_CONVERT(request, response) {
    var row = {};
    for (var i in request) {
        var aa = i.toLocaleUpperCase();
        row[aa] = request[i];
    }
    var results = {};
    results['REQUEST'] = row;
    results['TIME'] = get_time();
    results['RESPONSE'] = response;
    return results;
}


async function changebalance_child(indata) {

    var userId = indata.userId;
    var Amount = indata.Amount;
    var TrnType = indata.TrnType;
    var TrnDescription = indata.TrnDescription;
    var roundId = indata.roundId;
    var gameId = indata.gameId;
    var History = indata.History;
    var hash = indata.hash;
    var sessionId = indata.sessionId;
    var newhash = BASECONTROL.md5convert(userId + Amount + TrnType + TrnDescription + roundId + gameId + History + passkey);
    var changebalancehandle = null;
    if (hash != newhash) {
        return ({ CODE: 500, status: false })
    } else {
        var sessionverify = await BASECONTROL.BfindOne(gamesessionModel, { token: sessionId });
        if (!sessionverify) {
            switch (TrnType) {
                case 'CANCELED_BET':
                    changebalancehandle = await cancel_bet(indata);
                    break;
                case 'WIN':
                    changebalancehandle = await win_child(indata);
                    break;
                case 'BET':
                    changebalancehandle = ({ CODE: 400, status: false })
                    break;
            }
            return changebalancehandle;
        } else {
            console.log("---sessionverify.ipaddress---sessionverify.ipaddress")
            console.log(sessionverify)
            indata['ip'] = sessionverify.ipaddress
            console.log(indata)
            switch (TrnType) {

                case 'CANCELED_BET': {
                    changebalancehandle = await cancel_bet(indata);
                    break;
                }
                case 'BET': {
                    changebalancehandle = await bet_child(indata);
                    break;
                }
                case 'WIN': {
                    changebalancehandle = await win_child(indata);
                    break;
                }
            }
            return (changebalancehandle);
        }
    }

}

async function get_gameid(indata) {
    var TrnDescription = indata.TrnDescription.split(":");
    var tableid = TrnDescription[1].split("=")[1];
    var gameid = tableid;
    if (tableid == "33") {
        gameid = indata.gameId;
        var item = await BASECONTROL.BfindOne(Gamelist, { "PROVIDERID": "BETSOFT", ID: gameid });
        if (item) {
            return { gameid: item._id, providerid: item.providerid };
        } else {
            return false;
        }
    } else {
        var item = await BASECONTROL.get_gameid(LAUNCHURL, gameid);
        return item;
    }
    // var item =  await BASECONTROL.get_gameid(LAUNCHURL,gameid);
}

async function bet_child(indata) {
    var Amount = parseFloat(indata.Amount);
    // var user = await BASECONTROL.BfindOne(playersUser,{id : indata.userId});
    var user = await BASECONTROL.playerFindByid(indata.userId);

    if (!user) {
        return { CODE: 310, status: false };
    } else {//{TransactionID : indata.TransactionID,TrnType : indata.TrnType}
        var lastbethandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: indata.TrnType, "betting.TransactionID": indata.TransactionID });
        if (!lastbethandle) {
            // var row = indata;
            if (user.balance < Amount) {
                return { CODE: 300, status: false };
            } else {
                var ECSYSTEMTRANSACTIONID = BASECONTROL.get_timestamp();
                var gameId = await get_gameid(indata);

                if (!gameId) {
                    return { CODE: 300, status: false };
                }
                var row = {
                    AMOUNT: Amount,
                    TYPE: indata.TrnType,
                    LAUNCHURL: LAUNCHURL,
                    transactionId: indata.TransactionID,
                    roundId: indata.roundId,
                    userid: mongoose.Types.ObjectId(indata.userId),
                    betting: {
                        prevbalance: user.balance,
                        ECSYSTEMTRANSACTIONID: ECSYSTEMTRANSACTIONID,
                        TransactionID: indata.TransactionID
                    },
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                    ipaddress: indata.ip
                };


                var wallets_ = {
                    commission: 0,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    status: indata.TrnType,
                    userid: mongoose.Types.ObjectId(indata.userId),
                    roundid: indata.roundId,
                    transactionid: indata.TransactionID,
                    lastbalance: user.balance,
                    credited: 0,
                    debited: Amount,
                    ipaddress: indata.ip
                }
                var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (!savehandle) {
                    return { CODE: 300, status: false };
                } else {
                    var updatehandle = await player_balanceupdatein(Amount * -1, indata.userId, wallets_);
                    if (updatehandle === false) {
                        return { CODE: 300, status: false };
                    } else {
                        return { status: true, BALANCE: updatehandle, ECSYSTEMTRANSACTIONID: row.betting["ECSYSTEMTRANSACTIONID"] }
                    }
                }
            }
        } else {
            return { status: true, BALANCE: user.balance, ECSYSTEMTRANSACTIONID: lastbethandle.betting["ECSYSTEMTRANSACTIONID"] }
            // return {CODE : 300,status : false};
        }
    }
}

async function win_child(indata) {
    var Amount = parseFloat(indata.Amount);
    // var user = await BASECONTROL.BfindOne(playersUser,{id : indata.userId});
    var user = await BASECONTROL.playerFindByid(indata.userId);

    if (!user) {
        return { CODE: 310, status: false };
    } else {//TrnType : indata.TrnType,TransactionID : indata.TransactionID
        var lastbethandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: indata.TrnType, "betting.TransactionID": indata.TransactionID });
        if (!lastbethandle) {

            var ECSYSTEMTRANSACTIONID = BASECONTROL.get_timestamp();
            var gameId = await get_gameid(indata);
            if (!gameId) {
                return { CODE: 300, status: false };
            }

            var {realamount, commamount} = await BASECONTROL.getWinningComission(Amount)

            var row = {
                AMOUNT: realamount,
                LAUNCHURL: LAUNCHURL,
                TYPE: indata.TrnType,
                userid: mongoose.Types.ObjectId(indata.userId),
                transactionId: indata.TransactionID,
                roundId: indata.roundId,
                betting: {
                    prevbalance: user.balance,
                    ECSYSTEMTRANSACTIONID: ECSYSTEMTRANSACTIONID,
                    TransactionID: indata.TransactionID

                },
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                providerid: mongoose.Types.ObjectId(gameId.providerid),
                ipaddress: indata.ip,
                commission: commamount,
            };

            var wallets_ = {
                commission: commamount,
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                status: indata.TrnType,
                userid: mongoose.Types.ObjectId(indata.userId),
                roundid: indata.roundId,
                transactionid: indata.TransactionID,
                lastbalance: user.balance,
                credited: realamount,
                debited: 0,
                ipaddress: indata.ip
            }

            var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
            if (!savehandle) {
                return { CODE: 300, status: false };
            } else {
                var updatehandle = await player_balanceupdatein(realamount, indata.userId, wallets_);
                if (updatehandle === false) {
                    return { CODE: 300, status: false };
                } else {
                    return { status: true, BALANCE: updatehandle, ECSYSTEMTRANSACTIONID: row.betting["ECSYSTEMTRANSACTIONID"] }
                }
            }
        } else {
            return { status: true, BALANCE: user.balance, ECSYSTEMTRANSACTIONID: lastbethandle.betting["ECSYSTEMTRANSACTIONID"] }
        }
    }
}

async function cancel_bet(indata) {
    var Amount = parseFloat(indata.Amount);
    // var user = await BASECONTROL.BfindOne(playersUser,{id : indata.userId});
    var user = await BASECONTROL.playerFindByid(indata.userId);

    if (!user) {
        return { CODE: 310, status: false };
    } else {
        var lastbethandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: indata.TrnType, "betting.TransactionID": indata.TransactionID });
        if (!lastbethandle) {

            var ECSYSTEMTRANSACTIONID = BASECONTROL.get_timestamp();
            var gameId = await get_gameid(indata);
            if (!gameId) {
                return { CODE: 300, status: false };
            }
            var row = {
                AMOUNT: Amount,
                TYPE: indata.TrnType,
                LAUNCHURL: LAUNCHURL,
                userid: mongoose.Types.ObjectId(indata.userId),
                transactionId: indata.TransactionID,
                roundId: indata.roundId,
                betting: {
                    prevbalance: user.balance,
                    ECSYSTEMTRANSACTIONID: ECSYSTEMTRANSACTIONID,
                    TransactionID: indata.TransactionID

                },
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                providerid: mongoose.Types.ObjectId(gameId.providerid),
                ipaddress: indata.ip
            };

            var wallets_ = {
                commission: 0,
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                status: indata.TrnType,
                userid: mongoose.Types.ObjectId(indata.userId),
                roundid: indata.roundId,
                transactionid: indata.TransactionID,
                lastbalance: user.balance,
                credited: Amount,
                debited: 0,
                ipaddress: indata.ip

            }

            var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
            if (!savehandle) {
                return { CODE: 300, status: false };
            } else {
                var updatehandle = await player_balanceupdatein(Amount, indata.userId, wallets_);
                if (updatehandle === false) {
                    return { CODE: 300, status: false };
                } else {
                    return { status: true, BALANCE: updatehandle, ECSYSTEMTRANSACTIONID: indata["ECSYSTEMTRANSACTIONID"] }
                }
            }
        } else {
            return { status: true, BALANCE: user.balance, ECSYSTEMTRANSACTIONID: lastbethandle["ECSYSTEMTRANSACTIONID"] }
        }
    }
}

async function get_status_child(indata) {
    var newhash = BASECONTROL.md5convert(indata.userId + indata.casinoTransactionId + passkey);
    var hash = indata.hash;
    if (newhash != hash) {
        return { CODE: 500, status: false };
    } else {//{TransactionID : indata.casinoTransactionId}
        var findhandle = await BASECONTROL.BfindOne(betting_historymodel, { $and: [{ LAUNCHURL: LAUNCHURL }, { "betting.TransactionID": indata.casinoTransactionId }] });
        if (!findhandle) {
            return { CODE: 302, status: false };
        } else {
            var senddata = XML_CONVERT(indata, { RESULT: "OK", ECSYSTEMTRANSACTIONID: findhandle.betting['ECSYSTEMTRANSACTIONID'] });
            return { status: true, data: senddata };
        }
    }
}

module.exports = class VIVOController {
    constructor() {
    }

    Authenticate = (req) => {
        return new Promise(async function (resolve, reject) {
            var url = req.url;
            var indata = urlparse(url);
            console.log("authenticate------------------------------------");
            let data = await authenticate_child(indata)
            if (data.status) {
                resolve(o2x({ '?xml version="1.0" encoding="iso-8859-1"?': null, VGSSYSTEM: data.data }));
            } else {
                data = XML_CONVERT(indata, { RESULT: "FAILED", CODE: data.CODE });
                resolve(o2x({ '?xml version="1.0" encoding="iso-8859-1"?': null, VGSSYSTEM: data }));
            }

            async function authenticate_child(indata) {
                let newhash = BASECONTROL.md5convert(indata.token + passkey);
                if (newhash != indata.hash) {
                    return ({ CODE: 500, status: false, RESULT: "" })
                } else {
                    let findhandle = await BASECONTROL.BfindOne(gamesessionModel, { token: indata.token });
                    if (!findhandle) {
                        return ({ CODE: 400, status: false, RESULT: false })
                    } else {
                        let plin = await BASECONTROL.PlayerFindByemail(findhandle.email);
                        if (!plin) {
                            return ({ CODE: 400, status: false, RESULT: false })
                        } else {
                            let cur = await BASECONTROL.getCurrency();
                            let outdata = XML_CONVERT(indata, { USERID: plin.id, USERNAME: plin.username, FIRSTNAME: plin.firstname, LASTNAME: plin.lastname, EMAIL: plin.email, CURRENCY: cur, BALANCE: plin.balance.toFixed(2), GAMESESSIONID: indata.token, RESULT: "OK" });
                            return ({ status: true, data: outdata })
                        }
                    }
                }
            }
        })
    }

    ChangeBalance = (req) => {

        return new Promise(async function (resolve, reject) {
            var indata = urlparse(req.url);
            console.log("--------changebalance")
            let resdata = await changebalance_child(indata);
            if (resdata.status) {
                // res.set('Content-Type', 'text/xml');
                var data = XML_CONVERT(urlparse(req.url), { RESULT: "OK", BALANCE: resdata.BALANCE, ECSYSTEMTRANSACTIONID: resdata.ECSYSTEMTRANSACTIONID });
                resolve(o2x({ '?xml version="1.0" encoding="iso-8859-1"?': null, VGSSYSTEM: data }));
            } else {
                // res.set('Content-Type', 'text/xml');
                var data = XML_CONVERT(urlparse(req.url), { RESULT: "FAILED", CODE: resdata.CODE });
                resolve(o2x({ '?xml version="1.0" encoding="iso-8859-1"?': null, VGSSYSTEM: data }));
            }
        })
    }

    // MD5(userid+Amount+TrnType+TrnDescription+roundid+GameId+History+PassKey)=

    Status = (req) => {
        return new Promise(async function (resolve, reject) {
            var indata = urlparse(req.url);
            var resstatus = await get_status_child(indata);
            if (resstatus.status) {
                resolve(o2x({ '?xml version="1.0" encoding="iso-8859-1"?': null, VGSSYSTEM: resstatus.data }));
            } else {
                var data = XML_CONVERT(indata, { RESULT: "FAILED", CODE: resstatus.CODE });
                resolve(o2x({ '?xml version="1.0" encoding="iso-8859-1"?': null, VGSSYSTEM: data }));
            }
        })
    }
    // Format: MD5(userId+CasinoTransactionId+PassKey)= Hash

    Getbalance = (req) => {
        return new Promise(async function (resolve, reject) {
            var indata = urlparse(req.url);
            var hash = indata.hash;
            var userId = indata.userId;
            var newhash = BASECONTROL.md5convert(userId + passkey);
            // res.set('Content-Type', 'text/xml');
            if (newhash != hash) {
                var senddata = XML_CONVERT(indata, { RESULT: "FAILED", CODE: 500 });
                resolve(o2x({ '?xml version="1.0" encoding="iso-8859-1"?': null, VGSSYSTEM: senddata }));
            } else {
                // var findhandle = await BASECONTROL.BfindOne(playersUser,{id : userId });
                var findhandle = await BASECONTROL.playerFindByid(indata.userId);

                if (!findhandle) {
                    var senddata = XML_CONVERT(indata, { RESULT: "FAILED", CODE: 300 });
                    resolve(o2x({ '?xml version="1.0" encoding="iso-8859-1"?': null, VGSSYSTEM: senddata }));
                } else {
                    var senddata = XML_CONVERT(indata, { RESULT: "OK", BALANCE: findhandle.balance.toFixed(2) });
                    resolve(o2x({ '?xml version="1.0" encoding="iso-8859-1"?': null, VGSSYSTEM: senddata }));
                }
            }
        })
    }
    // Format: MD5(userId+PassKey)=Hash

}
