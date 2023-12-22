const BASECONTROL = require("./../basecontroller");
const CONFIG = require("../../servers/provider.json");
const USERSMODEL = require("../../models/users_model");
const gamesessionModel = USERSMODEL.gamesessionmodel;
const betting_historymodel = require("../../models/bettinghistory_model").binaryBettingHistory_model;
const mongoose = require('mongoose');
const Gamelist = require("../../models/games_model").GAMELISTMODEL;
const LAUNCHURL = "20";


async function player_balanceupdatein(amount, userId, wallets) {
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount, userId, wallets);
    return outdata.toFixed(2);
}

exports.authenticate = async (req,res,next) => {
    console.log(req.body)
    let {tokenId, tokenKey} = req.body
    if (tokenKey) {
        let findhandle = await BASECONTROL.BfindOne(gamesessionModel, { token: tokenKey });
        if (!findhandle) {
            res.send({ status: false, data: "Token not found" })
            return next()
        } else {
            let plin = await BASECONTROL.PlayerFindByemail(findhandle.email);
            if (!plin) {
                res.send({  status: false, data: "User not found" })
                return next()
            } else {
                let cur = await BASECONTROL.getCurrency();
                let outdata = { USERID: plin.id, USERNAME: plin.username, FIRSTNAME: plin.firstname, LASTNAME: plin.lastname, EMAIL: plin.email, CURRENCY: cur, BALANCE: plin.balance.toFixed(2)};
                res.send({ status: true, data: outdata })
                return next()
            }
        }

    } else {
        res.send({ status: false, data: "server error" })
        return next()
    }
        
}

exports.debit = async (req,res,next) => {
    console.log(req.body)
    console.log(req.body)
    let indata = req.body
    let Amount = indata.betCost
    let TransactionID = indata.tradeId
    let userid = indata.userid
    let roundId = indata.tradeId
    let nbettingdata = Object.assign({}, indata)
    delete nbettingdata.userid
    delete nbettingdata.createdAt
    delete nbettingdata.updatedAt
    delete nbettingdata.status

    var user = await BASECONTROL.playerFindByid(userid);

    if (!user) {
        res.send({ status: false, data: "User not found" })
        return next()
    } else {//{T

        if (user.balance < Amount) {
            res.send({ status: false, data: "Insufficient funds" })
            return next()
        } else {
        
            var row = {
                AMOUNT: Amount,
                TYPE: "BET",
                transactionId: TransactionID,
                roundId: roundId,
                userid: mongoose.Types.ObjectId(userid),
                betting: {
                    ...nbettingdata,
                    prevbalance: user.balance,
                },
                ipaddress: "127.0.0.1"
            };
        
        
            var wallets_ = {
                commission: 0,
                status: "BET",
                userid: mongoose.Types.ObjectId(userid),
                roundid: roundId,
                transactionid: TransactionID,
                lastbalance: user.balance,
                credited: 0,
                debited: Amount,
                ipaddress: "127.0.0.1",
                
            }
            var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
            if (!savehandle) {
                res.send({ status: false, data: "server error" })
                return next()
            } else {
                wallets_['binarydata'] = savehandle._id
                var updatehandle = await player_balanceupdatein(Amount * -1, userid, wallets_);
                if (updatehandle === false) {
                    res.send({ status: false, data: "server error" })
                    return next()
                } else {
                     res.send({ status: true, BALANCE: updatehandle })
                     return next()
                }
            }
        }
    }
}

exports.credit = async (req,res,next) => {
    console.log(req.body)
    console.log(req.body)
    let indata = req.body
    let Amount = indata.endCost
    let TransactionID = indata.tradeId
    let userid = indata.userid
    let roundId = indata.tradeId
    let nbettingdata = Object.assign({}, indata)
    delete nbettingdata.userid
    delete nbettingdata.createdAt
    delete nbettingdata.updatedAt
    delete nbettingdata.status

    var user = await BASECONTROL.playerFindByid(userid);

    if (!user) {
        res.send({ status: false, data: "User not found" })
        return next()
    } else {//{T

     
        var {realamount, commamount} = await BASECONTROL.getWinningComission(Amount)

        var row = {
            AMOUNT: realamount,
            TYPE: "WIN",
            transactionId: TransactionID,
            roundId: roundId,
            userid: mongoose.Types.ObjectId(userid),
            betting: {
                ...nbettingdata,
                prevbalance: user.balance,
            },
            ipaddress: "127.0.0.1",
            commission: commamount,
        };
    
    
        var wallets_ = {
            commission: commamount,
            status: "WIN",
            userid: mongoose.Types.ObjectId(userid),
            roundid: roundId,
            transactionid: TransactionID,
            lastbalance: user.balance,
            credited: 0,
            debited: Amount,
            ipaddress: "127.0.0.1",
            
        }
        var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
        if (!savehandle) {
            res.send({ status: false, data: "server error" })
            return next()
        } else {
            wallets_['binarydata'] = savehandle._id
            var updatehandle = await player_balanceupdatein(Amount , userid, wallets_);
            if (updatehandle === false) {
                res.send({ status: false, data: "server error" })
                return next()
            } else {
                    res.send({ status: true, BALANCE: updatehandle })
                    return next()
            }
        }
    
    }
}

exports.getbalance = async (req,res,next) => {
    console.log(req.body)
    let {userid, tokenKey} = req.body
    let plin = await BASECONTROL.playerFindByid(userid);
    if (!plin) {
        res.send({  status: false, data: "error" })
        return next()
    } else {
        let cur = await BASECONTROL.getCurrency();
        res.send({ status: true, data: plin.balance.toFixed(2) })
        return next()
    }
}


// -Authenticate function
// tokenId:
// tokenKey: 


// Getbalance Function
// userid:
// balance: 9160
