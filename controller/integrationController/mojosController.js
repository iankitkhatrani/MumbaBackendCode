const BASECONTROL = require("./../basecontroller");
const playersUser = require("../../models/users_model").GamePlay
const gamesessionModel = require("../../models/users_model").gamesessionmodel
const LAUNCHURL = "12";
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
const url = require('url');
const mongoose = require("mongoose");
const { firstpagesetting } = require("../../models/firstpage_model")

async function player_balanceupdatein(amount, userId, wallets) {
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount, userId, wallets);
    return outdata.toFixed(2);
}

function urlparse(adr) {
    var q = url.parse(adr, true);
    var qdata = q.query;
    return qdata;
}

exports.hash_check = async (req, res, next) => {
    var url = req.url;
    var indata2 = urlparse(url);
    let data = await firstpagesetting.findOne({ type: "MojosCreential" });
    if (data) {
        console.log(data.content.hashkey)
        var hash = (BASECONTROL.md5convert(JSON.stringify(req.body) + data.content.hashkey)).toLocaleUpperCase();
        var hash_ = indata2.hash;
        console.log(hash_)
        console.log(hash)
        if (hash == hash_) {
            next();
        } else {
            res.status(400).send({ code: 2 });
        }
    } else {
        res.status(400).send({ code: 2 });
    }
}

exports.authenticate = async (req, res, next) => {

    console.log("-------authenticate -------------")
    var indata1 = req.body;
    var ses = await BASECONTROL.BfindOne(gamesessionModel, { token: indata1.Token });
    if (!ses) {
        res.status(400).send({ code: 4 })
        return next();
    } else {
        var user = await BASECONTROL.PlayerFindByemail(ses.email);
        if (!user) {
            res.status(400).send({ code: 1 })
            return next();
        } else {
            let currency = await BASECONTROL.getCurrency();
            var row = Object.assign({}, { SessionId: indata1.Token, Token: indata1.Token, UserId: user.id, Currency: currency, Balance: (user.balance).toFixed(2), Username: user.username });
            console.log(row)
            res.json(row);
            return next();
        }
    }
}

exports.getbalance = async (req, res, next) => {
    console.log("---------getbalance");
    var indata = req.body;
    var user = await BASECONTROL.playerFindByid(indata.UserId);
    if (user) {
        var row = Object.assign({}, { Balance: (user.balance).toFixed(2) });
        res.json(row);
        return next();
    } else {
        res.status(400).send({ code: 4 })
        return next();
    }

}

exports.debit = async (req, res, next) => {
    console.log(req.body);
    var indata1 = req.body;
    console.log(indata1);
    let UserId = indata1.UserId;
    let Amount = parseFloat(indata1.Amount);
    let ip = ""
    var ses = await BASECONTROL.BfindOne(gamesessionModel, { id: UserId });
    if (ses) {
        ip = ses.ipaddress
    } else {
    
    }

    var user = await BASECONTROL.playerFindByid(UserId);
    if (!user) {
        console.log(":--1")
        res.status(400).send({ code: 1 })
        return next();
    } else {
        var lastbethandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: "BET", "betting.TransactionId": indata1.TransactionId });
        if (!lastbethandle) {
            let GameId = (indata1.TrnDescription).split(":")[1].split("=")[1];
            if (user.balance < Amount) {
                console.log(":--2")
                res.status(400).send({ code: 3 })
                return next();
            } else {

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL, GameId);
                if (!gameId) {
                    res.status(400).send({ code: 1 })
                    return next();
                }


                var row = {
                    AMOUNT: Amount,
                    LAUNCHURL: LAUNCHURL,
                    TYPE: "BET",
                    transactionId: indata1.TransactionId,
                    roundId: indata1.TransactionId,
                    userid: mongoose.Types.ObjectId(user.id),
                    betting: {
                        TransactionId: indata1.TransactionId,
                        prevbalance: user.balance,

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
                    roundid: indata1.TransactionId,
                    transactionid: indata1.TransactionId,
                    lastbalance: user.balance,
                    credited: Amount,
                    debited: 0,
                    ipaddress: ip
                }
                var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (!savehandle) {
                    console.log(":--3");
                    res.status(400).send({ code: 1 })
                    return next();
                } else {
                    var updatehandle = await player_balanceupdatein(Amount * -1, UserId, wallets_);
                    if (updatehandle === false) {
                        res.status(400).send({ code: 1 })
                        return next();
                    } else {
                        console.log(":--5");
                        var row = Object.assign({}, { TransactionId: savehandle._id, Balance: updatehandle });
                        res.json(row);
                        return next();
                    }
                }
            }
        } else {
            res.status(400).send({ code: 1 })
            return next();
        }
    }


}

exports.credit = async (req, res, next) => {
    console.log(req.body);
    var indata1 = req.body;
    console.log(indata1);
    let UserId = indata1.UserId;
    let Amount = parseFloat(indata1.Amount);
    console.log(Amount)
    let ip = ""
    var ses = await BASECONTROL.BfindOne(gamesessionModel, { id: UserId });
    if (ses) {
        ip = ses.ipaddress
    } else {
    
    }

    var user = await BASECONTROL.playerFindByid(UserId);
    if (!user) {
        console.log(":--1")
        res.status(400).send({ code: 1 })
        return next();
    } else {
        // var lastbethandle = await BASECONTROL.BfindOne(betting_historymodel,{$and :[{LAUNCHURL : LAUNCHURL},{TYPE : "BET"},{"betting.TransactionId" : indata1.TransactionId}]});
        // if(lastbethandle){
        var lastwinhandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: "WIN", "betting.TransactionId": indata1.TransactionId });
        if (!lastwinhandle) {
            let GameId = (indata1.TrnDescription).split(":")[1].split("=")[1];

            var gameId = await BASECONTROL.get_gameid(LAUNCHURL, GameId);
            if (!gameId) {
                res.status(400).send({ code: 1 })
                return next();
            }

            let {realamount, commamount} = await BASECONTROL.getWinningComission(Amount)

            var row = {
                AMOUNT: realamount,
                LAUNCHURL: LAUNCHURL,
                TYPE: "WIN",
                userid: mongoose.Types.ObjectId(user.id),
                transactionId: indata1.TransactionId,
                roundId: indata1.TransactionId,
                betting: {
                    TransactionId: indata1.TransactionId,
                    prevbalance: user.balance
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
                roundid: indata1.TransactionId,
                transactionid: indata1.TransactionId,
                lastbalance: user.balance,
                credited: realamount,
                debited: 0,
                ipaddress: ip
            }


            var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
            if (!savehandle) {
                console.log(":--3");
                res.status(400).send({ code: 1 })
                return next();
            } else {
                var updatehandle = await player_balanceupdatein(realamount, UserId, wallets_);
                if (updatehandle === false) {
                    console.log(":--4")
                    res.status(400).send({ code: 1 })
                    return next();
                } else {
                    console.log(":--5");
                    var row = Object.assign({}, { TransactionId: savehandle._id, Balance: updatehandle });
                    res.json(row);
                    return next();
                }
            }
        } else {
            var row = Object.assign({}, { TransactionId: lastwinhandle._id, Balance: user.balance.toFixed(2) });
            res.json(row);
            return next();
        }
        // }else{
        //     res.status(400).send({code  : 1})
        //     return next();
        // }
    }
}

exports.status = async (req, res, next) => {
    var indata = req.body;
    console.log("---------------status------------------");
    console.log(indata);
    var lastbethandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, "betting.TransactionId": indata.TransactionId });
    if (lastbethandle) {
        var useritem = await BASECONTROL.playerFindByid(lastbethandle.userid);
        if (useritem) {
            var row = Object.assign({}, { TransactionId: lastbethandle._id });
            res.json(row);
            return next();
        } else {
            res.status(400).send({ code: 0 })
            return next();
        }
    } else {
        res.status(400).send({ code: 0 })
        return next();
    }
}

exports.rollback = async (req, res, next) => {
    console.log("-------rollback-----------")
    console.log(req.body);
    var indata1 = req.body;
    console.log(indata1);
    let UserId = indata1.UserId;
    let Amount = parseFloat(indata1.Amount);

    let ip = ""
    var ses = await BASECONTROL.BfindOne(gamesessionModel, { id: UserId });
    if (ses) {
        ip = ses.ipaddress
    } else {
    
    }

    var user = await BASECONTROL.playerFindByid(UserId);
    if (!user) {
        console.log(":--1")
        res.status(400).send({ code: 1 })
        // return next();
    } else {

        var lastbethandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: "BET", "betting.TransactionId": indata1.TransactionId });
        if (lastbethandle) {

            var lastwinhandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: "CANCELED_BET", "betting.TransactionId": indata1.TransactionId });
            if (!lastwinhandle) {

                var row = {
                    AMOUNT: Amount,
                    LAUNCHURL: LAUNCHURL,
                    TYPE: "CANCELED_BET",
                    userid: mongoose.Types.ObjectId(user.id),
                    transactionId: indata1.TransactionId,
                    roundId: indata1.TransactionId,
                    betting: {
                        TransactionId: indata1.TransactionId,
                        prevbalance: user.balance
                    },
                    gameid: mongoose.Types.ObjectId(lastbethandle.gameid),
                    providerid: mongoose.Types.ObjectId(lastbethandle.providerid),
                    ipaddress: ip
                };

                var wallets_ = {
                    commission: 0,
                    gameid: mongoose.Types.ObjectId(lastbethandle.gameid),
                    status: "CANCELED_BET",
                    userid: mongoose.Types.ObjectId(user.id),
                    roundid: indata1.TransactionId,
                    transactionid: indata1.TransactionId,
                    lastbalance: user.balance,
                    credited: Amount,
                    debited: 0,
                    ipaddress: ip
                }


                var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (!savehandle) {
                    console.log(":--3");
                    res.status(400).send({ code: 1 })
                    return next();
                } else {
                    var updatehandle = await player_balanceupdatein(Amount, UserId, wallets_);
                    if (updatehandle === false) {
                        console.log(":--4")
                        res.status(400).send({ code: 1 })
                        return next();
                    } else {
                        console.log(":--5");
                        console.log(updatehandle)
                        var row = Object.assign({}, { TransactionId: savehandle._id, Balance: updatehandle });
                        res.json(row);
                        return next();
                    }
                }
            } else {

                console.log(":--333333333333333333")
                var row = Object.assign({}, { TransactionId: lastwinhandle._id, Balance: user.balance.toFixed(2) });
                res.json(row);
                return next();
            }
        } else {
            console.log(":--3333333333333333333333333333333333333333333")
            var row = Object.assign({}, { TransactionId: new Date().valueOf(), Balance: user.balance.toFixed(2) });
            res.json(row);
            return next();
        }
    }
}

exports.resolve = async (req, res, next) => {
    var indata = req.body.OriginalRequest;
    console.log("-----------resolve --------------");

}

exports.offlinecredit = async (req, res, next) => {

}


exports.delayedCredit = async (req, res, next) => {
    console.log(req.body);
    var indata1 = req.body;
    console.log(indata1);
    let UserId = indata1.UserId;
    let Amount = parseFloat(indata1.Amount);
    console.log(Amount)

    let ip = ""
    var ses = await BASECONTROL.BfindOne(gamesessionModel, { id: UserId });
    if (ses) {
        ip = ses.ipaddress
    } else {
    
    }

    var user = await BASECONTROL.playerFindByid(UserId);
    if (!user) {
        console.log(":--1")
        res.status(400).send({ code: 1 })
        return next();
    } else {
        // var lastbethandle = await BASECONTROL.BfindOne(betting_historymodel,{$and :[{LAUNCHURL : LAUNCHURL},{TYPE : "BET"},{"betting.TransactionId" : indata1.TransactionId}]});
        // if(lastbethandle){
        var lastwinhandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: "WIN", "betting.TransactionId": indata1.TransactionId });
        if (!lastwinhandle) {
            let GameId = (indata1.TrnDescription).split(":")[1].split("=")[1];

            var gameId = await BASECONTROL.get_gameid(LAUNCHURL, GameId);
            if (!gameId) {
                res.status(400).send({ code: 1 })
                return next();
            }


            var row = {
                AMOUNT: Amount,
                LAUNCHURL: LAUNCHURL,
                TYPE: "WIN",
                userid: mongoose.Types.ObjectId(user.id),
                betting: {
                    TransactionId: indata1.TransactionId,
                    prevbalance: user.balance
                },
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                providerid: mongoose.Types.ObjectId(gameId.providerid),
                ipaddress: ip
            };

            var wallets_ = {
                commission: 0,
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                status: "WIN",
                userid: mongoose.Types.ObjectId(user.id),
                roundid: indata1.TransactionId,
                transactionid: indata1.TransactionId,
                lastbalance: user.balance,
                credited: Amount,
                debited: 0,
                ipaddress: ip
            }


            var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
            if (!savehandle) {
                console.log(":--3");
                res.status(400).send({ code: 1 })
                return next();
            } else {
                var updatehandle = await player_balanceupdatein(Amount, UserId, wallets_);
                if (updatehandle === false) {
                    console.log(":--4")
                    res.status(400).send({ code: 1 })
                    return next();
                } else {
                    console.log(":--5");
                    setTimeout(() => {
                        var row = Object.assign({}, { TransactionId: savehandle._id, Balance: updatehandle });
                        res.json(row);
                        return next();
                    }, 30000)
                }
            }
        } else {
            var row = Object.assign({}, { TransactionId: lastwinhandle._id, Balance: user.balance.toFixed(2) });
            res.json(row);
            return next();
        }
        // }else{
        //     res.status(400).send({code  : 1})
        //     return next();
        // }
    }

}


exports.delayedDebit = async (req, res, next) => {
    console.log(req.body);
    var indata1 = req.body;
    console.log(indata1);
    let UserId = indata1.UserId;
    let Amount = parseFloat(indata1.Amount);
    var user = await BASECONTROL.playerFindByid(UserId);
    if (!user) {
        console.log(":--1")
        res.status(400).send({ code: 1 })
        return next();
    } else {
        var lastbethandle = await BASECONTROL.BfindOne(betting_historymodel, { LAUNCHURL: LAUNCHURL, TYPE: "BET", "betting.TransactionId": indata1.TransactionId });
        if (!lastbethandle) {
            let GameId = (indata1.TrnDescription).split(":")[1].split("=")[1];
            if (user.balance < Amount) {
                console.log(":--2")
                res.status(400).send({ code: 3 })
                return next();
            } else {

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL, GameId);
                if (!gameId) {
                    res.status(400).send({ code: 1 })
                    return next();
                }


                var row = {
                    AMOUNT: Amount,
                    LAUNCHURL: LAUNCHURL,
                    TYPE: "BET",
                    userid: mongoose.Types.ObjectId(user.id),
                    betting: {
                        TransactionId: indata1.TransactionId,
                        prevbalance: user.balance,

                    },
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                };

                var wallets_ = {
                    commission: 0,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    status: "BET",
                    userid: mongoose.Types.ObjectId(user.id),
                    roundid: indata1.TransactionId,
                    transactionid: indata1.TransactionId,
                    lastbalance: user.balance,
                    credited: Amount,
                    debited: 0
                }
                var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (!savehandle) {
                    console.log(":--3");
                    res.status(400).send({ code: 1 })
                    return next();
                } else {
                    var updatehandle = await player_balanceupdatein(Amount * -1, UserId, wallets_);
                    if (updatehandle === false) {
                        res.status(400).send({ code: 1 })
                        return next();
                    } else {
                        console.log(":--5");
                        setTimeout(() => {
                            var row = Object.assign({}, { TransactionId: savehandle._id, Balance: updatehandle });
                            res.json(row);
                            return next();
                        }, 30000)
                    }
                }
            }
        } else {
            res.status(400).send({ code: 1 })
            return next();
        }
    }
}