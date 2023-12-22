const LAUNCHURL = "15";
var mongoose = require('mongoose');

const BASECONTROL = require("./../basecontroller");
const gamesessionModel = require("../../models/users_model").gamesessionmodel
const playerModel = require("../../models/users_model").GamePlay
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;

async function player_balanceupdatein(amount, uid, wallets) {
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount, uid, wallets);
    return outdata;
}

exports.walletbalance = async (req, res, next) => {
    var reqp = {
        currentTime: '1630481724737',
        accountId: 'IGAMEZ_2249876',
        merchantId: 'IGAMEZ',
        sign: 'f76f638a8c7e2dff0d0f41ecb3675e49',
        currency: 'INR'
    }


    console.log(req.body)
    const { merchantId, accountId } = req.body
    let playerpid = accountId.split("_")[1]
    var ses = await BASECONTROL.BfindOne(playerModel, { pid: playerpid });
    if (!ses) {
        res.send({
            "msg": "Single wallet does not exist or cannot be obtained",
            "code": 9100
        })
    } else {
        var user = await BASECONTROL.PlayerFindByemail(ses.email);
        if (!user) {
            res.send({
                "msg": "Single wallet does not exist or cannot be obtained",
                "code": 9100
            })
        } else {
            console.log(ses)
            res.send({
                "msg": "success",
                "code": 0,
                "data": {
                    "currency": "INR",
                    "balance": Number((user.balance).toFixed(2)),
                    "bonusBalance": 0
                }
            })
        }
    }
    return next()
}

exports.eventTime = () => {
    let d = new Date().toJSON()
    return d.slice(0, 10) + " " + d.slice(11, 19)
}

exports.walletfundtransfer = async (req, res, next) => {
    var reqp = {
        "currentTime": "1605770685326",
        "gameId": "AWS_1",
        "accountId": "SINGLE_AE001",
        "amount": -5,
        "betAmount": 5,
        "winAmount": 0,
        "merchantId": "SINGLE",
        "sign": "526d30dc6ea4f709e5c6791cd06345c3",
        "currency": "USD",
        "txnTypeId": 100,
        "txnId": "SINGLEUSD_720_5009949305159149"
    }

    const { currency, amount, txnId, txnTypeId, accountId } = req.body
    if (txnTypeId == 100) {
        let rdata = await debit_child(req.body)
        console.log(rdata, "--rdata--")

        if (rdata.code == 0) {

            let data = {
                msg: rdata.msg,
                code: rdata.code,
                data: {
                    currency,
                    amount,
                    txnId,
                    balance: Number(rdata.balance.toFixed(2)),
                    bonusBalance: 0,
                    accountId,
                    eventTime: this.eventTime()
                }
            }
            console.log(data)
            res.send(data)
            return next()
        } else {
            res.send({
                code: rdata.code,
                msg: rdata.msg
            })
            return next()
        }
    } else {

    }
}

async function get_play(uid) {
    var user = await BASECONTROL.playerFindByid(uid);
    return user;
}

async function debit_child(indata) {
    var debitAmount = Number(indata.betAmount);
    var winloseAmount = Number(indata.winAmount);
    var sess_bool = null
    const { merchantId, accountId, txnTypeId } = indata
    let playerpid = accountId.split("_")[1]

    var sess_bool = await BASECONTROL.BfindOne(playerModel, { pid: playerpid });
    if (!sess_bool) {
        return { code: 4, msg: "Token expired", balance: 0, username: "" };
    } else {

        var uid = sess_bool.userid
        var user = await get_play(uid);
        if (!user) {
            return { code: 5, msg: "Other error1", balance: 0, username: "", };
        } else {
            let ip = sess_bool.ipaddress
            var lastdebit = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: "BET", "betting.txnId": indata.txnId });
            if (!lastdebit) {
                if (Number(user.balance.toFixed(2)) < debitAmount) {
                    return { code: 1201, msg: "Insufficient balance", balance: user.balance, username: user.username, };
                } else {

                    var gameId = await BASECONTROL.get_gameid(LAUNCHURL, indata.gameId);
                    if (!gameId) {
                        return { code: 5, msg: "Other error2", balance: user.balance, username: user.username, };
                    }

                    var row = {
                        AMOUNT: debitAmount,
                        LAUNCHURL: LAUNCHURL,
                        TYPE: "BET",
                        userid: mongoose.Types.ObjectId(user.id),
                        transactionId: indata.txnId,
                        roundId: indata.txnId,
                        betting: {
                            prevbalance: user.balance,
                            txnId: indata.txnId,
                        },
                        gameid: mongoose.Types.ObjectId(gameId.gameid),
                        providerid: mongoose.Types.ObjectId(gameId.providerid),
                        ipaddress: ip
                    };

                    var wallets_ = {
                        commission: 0,
                        gameid: mongoose.Types.ObjectId(gameId.gameid),
                        status: "BET",
                        userid: mongoose.Types.ObjectId(user.id),
                        roundid: indata.txnId,
                        transactionid: indata.txnId,
                        lastbalance: user.balance,
                        credited: 0,
                        debited: debitAmount,
                        ipaddress: ip
                    }

                    var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                    if (!savehandle) {
                        return { code: 5, balance: user.balance, username: user.username, msg: "Other error5" };
                    } else {
                        var updatehandle = await player_balanceupdatein((debitAmount) * -1, uid, wallets_);
                        if (updatehandle === false) {
                            return { code: 5, balance: user.balance, username: user.username, msg: "Other error6" };
                        } else {
                            // return { code: 0, balance: updatehandle, username: user.username, msg: "success" };

                            if (winloseAmount > 0) {
                                let {realamount, commamount} = await BASECONTROL.getWinningComission(winloseAmount)
                                var row = {
                                    AMOUNT: realamount,
                                    LAUNCHURL: LAUNCHURL,
                                    TYPE: "WIN",
                                    userid: mongoose.Types.ObjectId(user.id),
                                    transactionId: indata.txnId,
                                    roundId: indata.txnId,
                                    betting: {
                                        prevbalance: updatehandle,
                                        txnId: indata.txnId,
                                    },
                                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                                    ipaddress: ip,
                                    commission: commamount,
                                };

                                var wallets_ = {
                                    commission: commamount,
                                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                                    status: "WIN",
                                    userid: mongoose.Types.ObjectId(user.id),
                                    roundid: indata.txnId,
                                    transactionid: indata.txnId,
                                    lastbalance: updatehandle,
                                    credited: realamount,
                                    debited: 0,
                                    ipaddress: ip
                                }

                                var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                                if (!savehandle) {
                                    return { code: 5, balance: updatehandle, username: user.username, msg: "Other error4" };
                                } else {
                                    var updatehandle = await player_balanceupdatein((realamount), uid, wallets_);
                                    if (updatehandle === false) {
                                        return { code: 5, balance: updatehandle, username: user.username, msg: "Other error3" };
                                    } else {
                                        return { code: 0, balance: updatehandle, username: user.username, msg: "success" };
                                    }
                                }
                            } else {
                                return { code: 0, balance: updatehandle, username: user.username, msg: "success" };

                            }
                        }
                    }
                }

            } else {
                return { code: 1, msg: "Already accepted ", balance: user.balance, username: user.username, }
            }
        }
    }

}


exports.walletfundquery = async (req, res, next) => {


    var reqp = {
        "accountId": "SINGLE_AE001 ",
        "currency": "USD",
        "txnId": "SINGLEUSD_720_5009949305159149",
        "gameId": "AWS_1",
        "amount": 0.1,
        "txnTypeId": 100,
        "currentTime": 1574675632299,
        "merchantId": " SINGLE",
        "sign": "f731911d9a5581ae757cd0dcb821d620"
    }

    const { currency, amount, txnId, txnTypeId, accountId } = req.body
    let rdata = null
    if (txnTypeId == 100) {
        let rdata = await cancel_child(req.body)

        console.log(rdata, "--cencel---rdata")
        if (rdata.code == 0) {

            let data = {
                msg: rdata.msg,
                code: rdata.code,
                data: {
                    currency,
                    amount,
                    txnId,
                    balance: Number(rdata.balance.toFixed(2)),
                    bonusBalance: 0,
                    accountId,
                    eventTime: this.eventTime()
                }
            }
            console.log(data)
            res.send(data)
            return next()
        } else {
            res.send({
                code: rdata.code,
                msg: rdata.msg
            })
            return next()
        }
    } else {

    }
    // res.send(
    //     {
    //         "msg": "success",
    //         "code": 0,
    //         "data": {
    //             "currency": "USD",
    //             "amount": 0.1,
    //             "accountId": "SINGLE_AE001",
    //             "txnId": "SINGLEUSD_720_5009949305159149",
    //             "eventTime": "2019-09-27 16:50:53",
    //             "balance": 91263.98,
    //             "bonusBalance": 0
    //         }
    //     }
    // )

    // return next()
}

async function cancel_child(indata) {

    var debitAmount = Number(indata.betAmount);
    var winloseAmount = Number(indata.winAmount);
    const { merchantId, accountId, txnTypeId } = indata
    let playerpid = accountId.split("_")[1]

    var sess_bool = await BASECONTROL.BfindOne(playerModel, { pid: playerpid });
    if (!sess_bool) {
        return { code: 4, msg: "Token expired", balance: 0, username: "" };
    } else {
        var uid = sess_bool.id;
        var user = await get_play(uid);
        if (!user) {
            return { code: 5, msg: "Other error1", balance: 0, username: "", };
        } else {
            let ip = sess_bool.ipaddress
            var lastdebit = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: "CANCELED_BET", "betting.txnId": indata.txnId });
            if (!lastdebit) {

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL, indata.gameId);
                if (!gameId) {
                    return { code: 5, msg: "Other error2", balance: user.balance, username: user.username, };
                }

                var row = {
                    AMOUNT: debitAmount,
                    LAUNCHURL: LAUNCHURL,
                    TYPE: "CANCELED_BET",
                    userid: mongoose.Types.ObjectId(user.id),
                    transactionId: indata.txnId,
                    roundId: indata.txnId,
                    betting: {
                        prevbalance: user.balance,
                        txnId: indata.txnId,
                    },
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                    ipaddress: ip
                };

                var wallets_ = {
                    commission: 0,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    status: "CANCELED_BET",
                    userid: mongoose.Types.ObjectId(user.id),
                    roundid: indata.txnId,
                    transactionid: indata.txnId,
                    lastbalance: user.balance,
                    credited: 0,
                    debited: debitAmount,
                    ipaddress: ip
                }

                var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (!savehandle) {
                    return { code: 5, balance: user.balance, username: user.username, msg: "Other error3" };
                } else {
                    var updatehandle = await player_balanceupdatein((debitAmount), uid, wallets_);
                    if (updatehandle === false) {
                        return { code: 5, balance: user.balance, username: user.username, msg: "Other error4" };
                    } else {

                        if (winloseAmount > 0) {
                            var row = {
                                AMOUNT: winloseAmount,
                                LAUNCHURL: LAUNCHURL,
                                TYPE: "CANCELED_BET",
                                userid: mongoose.Types.ObjectId(user.id),
                                transactionId: indata.txnId,
                                roundId: indata.txnId,
                                betting: {
                                    prevbalance: updatehandle,
                                    txnId: indata.txnId,
                                },
                                gameid: mongoose.Types.ObjectId(gameId.gameid),
                                providerid: mongoose.Types.ObjectId(gameId.providerid),
                                ipaddress: ip
                            };

                            var wallets_ = {
                                commission: 0,
                                gameid: mongoose.Types.ObjectId(gameId.gameid),
                                status: "CANCELED_BET",
                                userid: mongoose.Types.ObjectId(user.id),
                                roundid: indata.txnId,
                                transactionid: indata.txnId,
                                lastbalance: updatehandle,
                                credited: 0,
                                debited: winloseAmount,
                                ipaddress: ip
                            }

                            var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                            if (!savehandle) {
                                return { code: 5, balance: updatehandle, username: user.username, msg: "Other error5" };
                            } else {
                                var updatehandle = await player_balanceupdatein((winloseAmount) * -1, uid, wallets_);
                                if (updatehandle === false) {
                                    return { code: 5, balance: updatehandle, username: user.username, msg: "Other error6" };
                                } else {
                                    return { code: 0, balance: updatehandle, username: user.username, msg: "success" };
                                }
                            }
                        } else {
                            return { code: 0, balance: updatehandle, username: user.username, msg: "success" };

                        }
                    }
                }


            } else {
                return { code: 1, msg: "Already accepted ", balance: user.balance, username: user.username, }
            }
        }
    }
}
