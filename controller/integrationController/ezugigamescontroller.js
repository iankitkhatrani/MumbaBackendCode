
const BASECONTROL = require("./../basecontroller");
const gamesessionModel = require("../../models/users_model").gamesessionmodel
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
var mongoose = require('mongoose');
const LAUNCHURL = "3";

async function player_balanceupdatein (amount,uid,wallets){
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount,uid,wallets);
    return outdata;
}

exports.hashcheck = async (req,res,next) => {
    // console.log(req.headers['hash']);
    // let data = JSON.stringify(req.body)
    // var hash1 = Crypto.createHmac("sha256", "37688e9a-46d9-4ea2-bdb9-19088ecbd8fe").update(data).digest("base64");
    // console.log(hash1);
    req.body.currency = await BASECONTROL.getCurrency();
    next();
}

    

exports.authentication = async(req,res,next)=>{
    
    var indata = req.body;
    var row={};
    row['timestamp'] = BASECONTROL.get_timestamp();

    var authres = await authentication_child(indata);
    console.log(authres,"---------au th ---------");
    row['operatorId'] = indata.operatorId;
    row['errorCode'] = authres.error;
    row['errorDescription'] = authres.errorDescription;
    if (!authres.status) {
        res.json(row);
        return next();
    } else {
        console.log(indata.currency)
        var user = authres.user;
        row['uid'] = user.id;
        row['nickName'] = user.username;
        row['balance'] = (user.balance).toFixed(2);
        row['token'] = authres.token;
        row['playerTokenAtLaunch'] = authres.token;
        row['currency'] = indata.currency;
        row['language'] = "en";
        row['date'] = BASECONTROL.get_time();
        row["clientIP"] = "127.0.0.1";
        row['VIP'] = "0";
        res.json(row);
        return next();
    }
}

async function authentication_child(indata) {
    var ses = await BASECONTROL.BfindOne(gamesessionModel,{token : indata.token});
    if (!ses) {
        return {status : false,error : 6,errorDescription : " Token not found"}
    } else {
        var user = await BASECONTROL.PlayerFindByemail( ses.email);
        if (!user) {
            return {status : false,error : 6,errorDescription : "Token not found"}
        } else {
            let row = ses;
            row['intimestamp'] = new Date().valueOf();
            delete row.token;
            delete row._id;
            let token = BASECONTROL.md5convert(JSON.stringify(row));
            let up = await gamesessionModel.findOneAndUpdate({email : row.email},{token : token},{upsert:true});
            if (up) {
                return {status : true,error : 0,errorDescription : "ok",user : user, token : token }
            } else {
                return {status : false,error : 6,errorDescription : "Token not found",}
            }
        }
    }
}

exports.debit = async(req,res,next)=>{
    var indata = req.body;
    var row = {};
    row['timestamp'] = BASECONTROL.get_timestamp();    
    var debitres = await debit_child(indata);
    console.log(debitres , "----------------debit ------------------")
    row['uid'] = indata.uid;
    row['operatorId'] = indata.operatorId;
    row['token'] = indata.token;
    row['currency'] = indata.currency;
    row['transactionId'] = indata.transactionId;
    row['roundId'] = indata.roundId;
    row['errorCode'] = debitres.error;
    row['errorDescription'] = debitres.errorDescription;

    if (debitres.status) {
        row['balance'] = (debitres.balance).toFixed(2);
        row['language'] = "en";
        row['clientIP'] = "127.0.0.1";
        row['nickName'] = debitres.username;
        res.json(row);
        return next();
    } else {

        if (debitres.error == 7) {
            row['balance'] = 0.00;        
            res.json(row);
            return next();
        } else {
            row['nickName'] = debitres.username;
            row['balance'] = (debitres.balance).toFixed(2);        
            res.json(row);
            return next();
        }
    }    
}

async function debit_child(indata){
    var debitAmount = indata.debitAmount;
    var uid = indata.uid;
    var user = await get_play(indata.uid);
    if (!user) {
        return {status : false,error : 7,errorDescription : "User not found"};
    } else {
        var sess_bool = await BASECONTROL.BfindOne(gamesessionModel,{token :indata.token});
        if (!sess_bool) {
            return {status : false,error : 6,errorDescription : "Token not found",balance : 0};
        } else {
            let ip = sess_bool.ipaddress
            var lastrollback = await BASECONTROL.BfindOne(betting_historymodel,{$and :[{LAUNCHURL : LAUNCHURL},{TYPE : "CANCELED_BET"},{"betting.transactionId" : indata.transactionId}]});
            if (lastrollback) {
                return { status : false,error : 1,errorDescription : "Debit after rollback",balance : user.balance};
            } else {//{transactionId : indata.transactionId,type : "BET"}
                var lastdebit = await BASECONTROL.BfindOne(betting_historymodel,{$and :[{LAUNCHURL : LAUNCHURL},{TYPE : "BET"},{"betting.transactionId" : indata.transactionId}]});
                if (!lastdebit) {
                    if ( debitAmount < 0) {
                        return {status : false,error : 1,balance:user.balance,username : user.username,errorDescription : "Negative amount"};
                    } else {
                        if ((user.balance).toFixed(2) < debitAmount) {   
                            return {status : false,error : 3,balance:user.balance,username : user.username,errorDescription : "Insufficient funds"};                    
                        } else {

                            var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.tableId);
                            if (!gameId) {
                                return {status : false,error : 1,balance : user.balance,errorDescription : "General error"};
                            }

                            var row = {
                                AMOUNT : debitAmount,
                                LAUNCHURL : LAUNCHURL,
                                TYPE : "BET",
                                userid : mongoose.Types.ObjectId(user.id),
                                transactionId : indata.transactionId,
                                roundId : indata.roundId,
                                betting : {
                                    prevbalance : user.balance,
                                    transactionId : indata.transactionId,
                                    debitTransactionId : indata.debitTransactionId
                                },
                                gameid : mongoose.Types.ObjectId(gameId.gameid),
                                providerid : mongoose.Types.ObjectId(gameId.providerid),
                                ipaddress: ip
                            };
                
                            var wallets_ = {
                                commission:0,
                                gameid : mongoose.Types.ObjectId(gameId.gameid),
                                status :"BET",
                                userid : mongoose.Types.ObjectId(user.id),
                                roundid :indata.roundId,
                                transactionid : indata.transactionId,
                                lastbalance : user.balance,
                                credited : 0,
                                debited : debitAmount,
                                ipaddress: ip
                            }

                            var savehandle = await BASECONTROL.data_save(row,betting_historymodel);
                            if (!savehandle) {
                                return {status : false,error : 1,balance:user.balance,username : user.username,errorDescription : "General error"};
                            } else {
                                var updatehandle = await player_balanceupdatein(parseFloat(debitAmount) * -1,uid,wallets_);
                                if (updatehandle === false) {
                                    return {status : false,error : 1,balance:user.balance,username : user.username,errorDescription : "General error"};
                                } else {
                                    return {status : true,error : 0,balance : updatehandle,username : user.username,errorDescription : "Complete"};
                                }
                            }
                        }
                    }
                } else {
                    return {status : true,error : 0,errorDescription : "transaction has already proceeded" ,balance:user.balance,username : user.username,}
                }
            }
        }
    }
}

exports.credit =async(req,res,next)=>{

    var indata = req.body;
    var row = {};
    var creditres = await credit_child(indata);

    row['timestamp'] = creditres.timestamp;
    row['uid'] = indata.uid;
    row['operatorId'] = indata.operatorId;
    row['token'] = indata.token;
    row['currency'] = indata.currency;
    row['transactionId'] = indata.transactionId;
    row['roundId'] = indata.roundId;
    row['errorCode'] = creditres.error;
    row['errorDescription'] =creditres.errorDescription ;
    if (creditres.error == 7) {
        row['balance'] = 0.00;
        res.json(row);
        return next();    
    } else {
        row['balance'] = (creditres.balance).toFixed(2);
        row['nickName'] = creditres.username;
        res.json(row);
        return next();
    }
}

async function credit_child(indata){

    var timestamp1 =  BASECONTROL.get_timestamp();    
    var creditAmount = indata.creditAmount;
    var uid = indata.uid;
    var user = await get_play(indata.uid);
    if (!user) {
        return {status : false,error : 7,errorDescription : "User not found" , timestamp : timestamp1};
    } else {
        let ip =""
        var sess_bool = await BASECONTROL.BfindOne(gamesessionModel,{token :indata.token});
        if (!sess_bool) {
            // return {status : false,error : 6,errorDescription : "Token not found",balance : 0};
        } else {
            ip = sess_bool.ipaddress
        }

        var lastcredit = await BASECONTROL.BfindOne(betting_historymodel,{$and :[{LAUNCHURL : LAUNCHURL},{TYPE : "WIN"},{"betting.transactionId" : indata.transactionId}]});
        if (!lastcredit) {//{debitTransactionId : indata.debitTransactionId,type : "WIN"}
        
        var relastcredit = await BASECONTROL.BfindOne(betting_historymodel,{$and :[{LAUNCHURL : LAUNCHURL},{TYPE : "WIN"},{"betting.debitTransactionId" : indata.debitTransactionId}]});
            if (!relastcredit) {//,{transactionId : indata.debitTransactionId,type : "BET"}
            
                var lastdebit = await BASECONTROL.BfindOne(betting_historymodel,{$and :[{LAUNCHURL : LAUNCHURL},{TYPE : "BET"},{"betting.transactionId" : indata.debitTransactionId}]});
                if (lastdebit) {
                    if ( creditAmount < 0) {
                        return {status : false,error : 1,balance:user.balance,username : user.username,errorDescription : "Negative amount" , timestamp : timestamp1};
                    } else {
        
                        var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.tableId);
                        if (!gameId) {
                            return {status : false,error : 1,balance : user.balance,errorDescription : "General error" , timestamp : timestamp1};
                        }

                        let {realamount, commamount} = await BASECONTROL.getWinningComission(creditAmount)

                        var row = {
                            AMOUNT : realamount,
                            LAUNCHURL : LAUNCHURL,
                            transactionId : indata.transactionId,
                            roundId : indata.roundId,
                            TYPE : "WIN",
                            userid : mongoose.Types.ObjectId(user.id),
                            betting : {
                                prevbalance : user.balance,
                                transactionId : indata.transactionId,
                                debitTransactionId : indata.debitTransactionId
                            },
                            gameid : mongoose.Types.ObjectId(gameId.gameid),
                            providerid : mongoose.Types.ObjectId(gameId.providerid),
                            ipaddress: ip,
                            commission: commamount
                        };
            
                        var wallets_ = {
                            commission:commamount,
                            gameid : mongoose.Types.ObjectId(gameId.gameid),
                            status :"WIN",
                            userid : mongoose.Types.ObjectId(user.id),
                            roundid :indata.roundId,
                            transactionid : indata.transactionId,
                            lastbalance : user.balance,
                            credited : realamount,
                            debited : 0,
                            ipaddress: ip
                        }

                        var savehandle = await BASECONTROL.data_save(row,betting_historymodel);
                        var timestamp =  BASECONTROL.get_timestamp();    
                        if (!savehandle) {
                            return {status : false,error : 1,balance:user.balance,username : user.username,errorDescription : "General error", timestamp : timestamp};
                        } else {
                            var updatehandle = await player_balanceupdatein(parseFloat(realamount),uid,wallets_);
                            if (updatehandle === false) {
                                return {status : false,error : 1,balance:user.balance,username : user.username,errorDescription : "General error", timestamp : timestamp};
                            } else {
                                return {status : true,error : 0,balance : updatehandle,username : user.username,errorDescription : "Complete", timestamp : timestamp};
                            }
                        }
                    }
                } else {
                    return {status : false,error : 9,errorDescription : "Debit transaction not found" ,balance:user.balance,username : user.username , timestamp : timestamp1} 
                }
            } else {
                return {status : false,error : 1,errorDescription : "Debit transaction already processed",balance:user.balance,username : user.username , timestamp : timestamp1};
            }
        } else {
            return {status : true,error : 0,errorDescription : "transaction already processed",balance:user.balance,username : user.username , timestamp : timestamp1}
        }
    }
}

async function get_play (uid){
    var user = await BASECONTROL.playerFindByid(uid);
    return user;
}

exports.rollback = async(req,res,next)=>{

    var indata = req.body;
    var row = {};
    row['timestamp'] = BASECONTROL.get_timestamp();

    var rollbackres = await rollback_child(indata);

    row['operatorId'] = indata['operatorId'];
    row['uid'] = indata['uid'];
    row['token'] = indata['token'];
    row['transactionId'] = indata['transactionId'];
    // row['currency'] = indata['currency'];
    row['currency'] = indata.currency;
    row['errorCode'] = rollbackres.error;
    row['errorDescription'] = rollbackres.errorDescription ;
    row['roundId'] = indata.roundId;

    if (rollbackres.error == 7) {
        row['balance'] = 0.00;
        res.json(row);
        return next();    
    } else {
        row['balance'] = (rollbackres.balance).toFixed(2);
        res.json(row);
        return next();
    }

}

async function rollback_child(indata){
    var rollbackAmount = indata.rollbackAmount;//{ transactionId : indata.transactionId,type:"BET" }

    var user = await get_play(indata.uid);
    if (!user) {
        return {status : false,error : 7,errorDescription : "User not found", balance : rollbackAmount};
    } else {//{transactionId : indata.transactionId,type:"CANCELED_BET"}
        var is_ex = await BASECONTROL.BfindOne(betting_historymodel,{$and :[{LAUNCHURL : LAUNCHURL},{TYPE : "CANCELED_BET"},{"betting.transactionId" : indata.transactionId}]})
        if (!is_ex) {

            let ip =""
        var sess_bool = await BASECONTROL.BfindOne(gamesessionModel,{token :indata.token});
        if (!sess_bool) {
            // return {status : false,error : 6,errorDescription : "Token not found",balance : 0};
        } else {
            ip = sess_bool.ipaddress
        }

            var lastDebit = await BASECONTROL.BfindOne(betting_historymodel, {$and :[{LAUNCHURL : LAUNCHURL},{TYPE : "BET"},{"betting.transactionId" : indata.transactionId}]});
            if (!lastDebit) {

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.tableId);
                if (!gameId) {
                    return {status : false,error : 1,balance : user.balance,errorDescription : "Invalid amount"};
                }
                var row = {
                    AMOUNT : rollbackAmount,
                    LAUNCHURL : LAUNCHURL,
                    TYPE : "CANCELED_BET",
                    transactionId : indata.transactionId,
                    roundId : indata.roundId,
                    userid : mongoose.Types.ObjectId(user.id),
                    betting : {
                        prevbalance : user.balance,
                        transactionId : indata.transactionId,
                        debitTransactionId : indata.debitTransactionId
                    },
                    gameid : mongoose.Types.ObjectId(gameId.gameid),
                    providerid : mongoose.Types.ObjectId(gameId.providerid),
                    ipaddress:ip
                };
                var savehandle = await BASECONTROL.data_save(row,betting_historymodel);

                if (!savehandle) {
                    return {status : false,error : 1,balance : user.balance,errorDescription : "General error"};
                } else {
                    return {status : false,error : 9,balance : user.balance,errorDescription : "debit for this transactionId was not found,rollback aborted."};
                }
            } else {
                // indata['type'] = "CANCELED_BET";
                indata['userId'] = user.id;
                indata['prevbalance'] = user.balance;
                
                var debitAmount = lastDebit.AMOUNT;
                if(debitAmount != rollbackAmount){
                    return {status : false,error : 1,balance : user.balance,errorDescription : "Invalid amount"}
                }else{

                    var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.tableId);
                    if (!gameId) {
                        return {status : false,error : 1,balance : user.balance,errorDescription : "General error"};
                    }
                    var row = {
                        AMOUNT : rollbackAmount,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "CANCELED_BET",
                        userid : mongoose.Types.ObjectId(user.id),
                        transactionId : indata.transactionId,
                        roundId : indata.roundId,
                        betting : {
                            prevbalance : user.balance,
                            transactionId : indata.transactionId,
                            debitTransactionId : indata.debitTransactionId
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                        ipaddress:ip
                    };
        
                    var wallets_ = {
                        commission:0,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"CANCELED_BET",
                        userid : mongoose.Types.ObjectId(user.id),
                        roundid :indata.transactionId,
                        transactionid : indata.transactionId,
                        lastbalance : user.balance,
                        credited : rollbackAmount,
                        debited : 0,
                        ipaddress:ip
                    }

                    var savehandle = await BASECONTROL.data_save(row,betting_historymodel);
                    if (!savehandle) {
                        return {status : false,error : 1,balance : user.balance,errorDescription : "General error"};
                    } else {
                        var updatehandle = await player_balanceupdatein(rollbackAmount,indata.uid,wallets_);
                        if (updatehandle === false) {
                            return {status : false,error : 1,balance : user.balance,errorDescription : "General error"}
                        } else {
                            return {status : true,error : 0,balance : updatehandle,errorDescription : "Complete"}
                        }
                    }
                }
            }
        } else {
            return {status : true,error : 0,errorDescription : "transaction has already proceeded",balance : user.balance,last : is_ex.betting};
        }
    }
}
