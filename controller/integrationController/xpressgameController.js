const Users = require("../../models/users_model")
const GameSessionModel = Users.gamesessionmodel;
const BaseControll = require("../basecontroller");
const group = "master"
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
const mongoose = require('mongoose');
const {firstpagesetting} = require("../../models/firstpage_model")
const LAUNCHURL = "6";

async function player_balanceupdatein (amount,uid,wallets){
    var outdata = await BaseControll.player_balanceupdatein_Id(amount,uid,wallets);
    return outdata;
   
}

function make_error_response(errorcode){
    return{
        "status": false,
        "code": parseInt(errorcode),
        "message": BaseControll.xpress_return_errorstring(errorcode)
    }
}

function make_success_response(data){
    return {
        "status": true,
        "code": 200,
        "message": "Success",
        "data": data
    }
}

function get_fingerprint(data, hashkey){
    var string = "";
    for(var i in data){
        string+=data[i];
    }
    string +=  hashkey;
    var res = BaseControll.md5convert(string);
    return res;
}

async function get_playerdetail(id){
    // var data = await BaseControll.BfindOne(PlayerModel,{id : id});
    var data = await BaseControll.playerFindByid(id);
    if(data){
        return data;
    }else{
        return false;
    }
}

async function loginChild(indata){
    var data = await BaseControll.BfindOne(GameSessionModel,{token : indata.token});
    if(!data){
        return make_error_response("106")
    }else{
        var detailuser = await get_playerdetail(data.id);
        if(!detailuser){
            return make_error_response("103")
        }else{
            var row={};
            row['playerId'] = detailuser.id;
            row['currency'] = "INR";
            row['playerNickname'] = detailuser.username;
            row['balance'] = parseFloat(detailuser.balance).toFixed(2);
            row['sessionId'] = indata.token;
            row['group'] = group;
            row['timestamp'] = new Date().toISOString();
            row['requestId'] = indata.requestId;
            row['fingerprint'] = get_fingerprint(row, indata.privateKey);
            return make_success_response(row);
        }
    }
}

exports.login_api = async (req,res,next) =>{
    console.log("-----------------xpress login api",req.body);
    var resdata = await loginChild(req.body);
    console.log(resdata)
    res.json(resdata);
    return next();
}

exports.config = async (req ,res , next) => {
    let con = await firstpagesetting.findOne({type : "XpressCredential"});
    console.log(con)
    if (con) {
        var privateKey = con.content.privateKey;
        req.body.privateKey = privateKey;
        console.log(privateKey)
        next();
    } else {
        res.json(make_error_response("103"));
        return next();
    }
}

async function balanceChild(indata){
    var detailuser = await get_playerdetail(indata.playerId);
    if(!detailuser){
        return make_error_response("103")
    }else{
        var row={};
        row['playerId'] = detailuser.id;
        row['currency'] = "INR";
        row['balance'] = parseFloat(detailuser.balance).toFixed(2);
        row['sessionId'] = indata.sessionId;
        row['group'] = group;
        row['timestamp'] = new Date().toISOString();
        row['requestId'] = indata.requestId;
        row['fingerprint'] = get_fingerprint(row, indata.privateKey);
        return make_success_response(row);
    }
}

exports.balance_api =async (req,res,next) =>{
    console.log("---------------xpress balance api",req.body);
    var resdata = await balanceChild(req.body);
    console.log(resdata)
    res.json(resdata);
    return next();
} 

async function debitChild(indata){

    console.log(indata," debitChild----------indata---------------")
    var detailuser = await get_playerdetail(indata.playerId);
    if(!detailuser){
        return make_error_response("103")
    }else{
        var transactionAmount = parseFloat(indata.transactionAmount);
        var lastbetverify = await BaseControll.BfindOne(betting_historymodel,{LAUNCHURL : LAUNCHURL,TYPE : "BET","betting.transactionId" : indata.transactionId})
        if(lastbetverify){
            return make_error_response("116")
        }else{
            var lastCycleverify = await BaseControll.BfindOne(betting_historymodel,{LAUNCHURL : LAUNCHURL,TYPE : "BET","betting.gameCycle" : indata.gameCycle});
            if(lastCycleverify){
                return make_error_response("115")
            }else{
                if(transactionAmount > detailuser.balance || transactionAmount == 0){
                    return make_error_response("107")
                }else{

                    var gameId = await BaseControll.get_gameid(LAUNCHURL,indata.gameId);

                    if ( !gameId) {
                        return make_error_response("103")
                    }
                

                    var betrow = {
                        AMOUNT : transactionAmount,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "BET",
                        userid : mongoose.Types.ObjectId(indata.playerId),
                        transactionId : indata.transactionId,
                        roundId : indata.gameCycle,
                        betting :{
                            transactionId : indata.transactionId,
                            gameCycle : indata.gameCycle
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };
        
                    var wallets_ = {
                        commission:0,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"BET",
                        userid : mongoose.Types.ObjectId(detailuser.userid),
                        roundid :indata.transactionId,
                        transactionid : indata.transactionId,
                        lastbalance : detailuser.balance,
                        credited : 0,
                        debited : transactionAmount
                    }

                    let sh =  await BaseControll.data_save(betrow , betting_historymodel);
                    if (sh) {
                        var updatehandle = await player_balanceupdatein(transactionAmount * -1,indata.playerId,wallets_);
                        if( updatehandle === false ){
                            return make_error_response("103")
                        }else{
                            var row={}
                            row['playerId'] = detailuser.id;
                            row['currency'] = "INR";
                            row['balance'] = parseFloat(updatehandle).toFixed(2);
                            row['oldBalance'] = parseFloat(detailuser.balance).toFixed(2);
                            row['transactionId'] = indata.transactionId;
                            row['sessionId'] = indata.sessionId;
                            row['group'] = group;
                            row['timestamp'] = new Date().toISOString();
                            row['requestId'] = indata.requestId;
                            row['fingerprint'] = get_fingerprint(row, indata.privateKey);
                            return make_success_response(row);
                        }

                    } else {
                        return make_error_response("103")

                    }
                }
            }
        }
    }
}

exports.debit_api = async (req,res,next) =>{
    console.log("-------------xpress debit api",req.body)
    var resdata = await debitChild(req.body);
    console.log(resdata);
    res.json(resdata);
    return next();
}

async function creditChild(indata){
    var detailuser = await get_playerdetail(indata.playerId);
    if(!detailuser){
        return make_error_response("103")
    }else{
        var transactionAmount =parseFloat(indata.transactionAmount);
        var lastbetverify = await BaseControll.BfindOne(betting_historymodel,{LAUNCHURL : LAUNCHURL,TYPE : "WIN","betting.transactionId" : indata.transactionId})
        if(lastbetverify){
            return make_error_response("116")
        }else{
            var lastCycleverify = await BaseControll.BfindOne(betting_historymodel,{LAUNCHURL : LAUNCHURL,TYPE : "BET","betting.gameCycle" : indata.gameCycle});
            if(!lastCycleverify){
                return make_error_response("112")
            }else{
                var lastCycleWinVerify = await BaseControll.BSortfind(betting_historymodel,{LAUNCHURL : LAUNCHURL,TYPE : "WIN","betting.gameCycle" : indata.gameCycle} , {_id : -1});
                if(lastCycleWinVerify.gameCycleClosed){
                    return make_error_response("118")
                }else{
                   
                    
                    var gameId = await BaseControll.get_gameid(LAUNCHURL,indata.gameId);

                    var {realamount, commamount} = await BASECONTROL.getWinningComission(transactionAmount)
                 

                    var betrow = {
                        AMOUNT : realamount,
                        LAUNCHURL : LAUNCHURL,
                        transactionId : indata.transactionId,
                    roundId : indata.gameCycle,
                        TYPE : "WIN",
                        userid : mongoose.Types.ObjectId(indata.playerId),
                        betting :{
                            transactionId : indata.transactionId,
                            gameCycle : indata.gameCycle
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                        commission:commamount
                    };
        
                    var wallets_ = {
                        commission:commamount,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"WIN",
                        userid : mongoose.Types.ObjectId(detailuser.userid),
                        roundid :indata.transactionId,
                        transactionid : indata.transactionId,
                        lastbalance : detailuser.balance,
                        credited : realamount,
                        debited : 0
                    }

                    var sh = await BaseControll.data_save(betrow , betting_historymodel);
                    if (sh) {
                        var updatehandle = await player_balanceupdatein(realamount * 1 , indata.playerId , wallets_);
                        if(updatehandle === false){
                            return make_error_response("103")
                        }else{
                            var row={}
                            row['playerId'] = detailuser.id;
                            row['currency'] = "INR";
                            row['balance'] = parseFloat(updatehandle).toFixed(2);
                            row['oldBalance'] = parseFloat(detailuser.balance).toFixed(2);
                            row['transactionId'] = indata.transactionId;
                            row['sessionId'] = indata.sessionId;
                            row['group'] = group;
                            row['timestamp'] = new Date().toISOString();
                            row['requestId'] = indata.requestId;
                            row['fingerprint'] = get_fingerprint(row, indata.privateKey);
                            return make_success_response(row);
                        }
                    } else {
                        return make_error_response("103")

                    }
                }
            }
        }
    }
}

exports.credit_api = async (req,res,next) =>{
    console.log("----------------xpress credit api",req.body);
    var resdata = await creditChild(req.body);
    console.log(resdata);
    res.json(resdata);
    return next();
}

async function rollbackChild(indata){
    var detailuser = await get_playerdetail(indata.playerId);
    if(!detailuser){
        return make_error_response("103")
    }else{
        var transactionAmount = parseFloat(indata.transactionAmount);
        var lastbetverify = await BaseControll.BfindOne(betting_historymodel,{LAUNCHURL : LAUNCHURL,TYPE : "BET","betting.transactionId" : indata.transactionId})
        if(!lastbetverify){
            return make_error_response("117");
        }else{
            var lastCycleverify = await BaseControll.BfindOne(betting_historymodel,{LAUNCHURL : LAUNCHURL,TYPE : "BET","betting.gameCycle" : indata.gameCycle});
            if(!lastCycleverify){
                return make_error_response("112")
            }else{
                var lastCycleWinVerify = await BaseControll.BSortfind(betting_historymodel,{LAUNCHURL : LAUNCHURL,TYPE : "WIN","betting.gameCycle" : indata.gameCycle} , {_id : -1});
                if(lastCycleWinVerify.gameCycleClosed){
                    return make_error_response("118")
                }else{
                    var lastRollBackVerify = await BaseControll.BfindOne(betting_historymodel , {LAUNCHURL : LAUNCHURL,TYPE : "CANCELED_BET","betting.gameCycle" : indata.gameCycle})
                    if(lastRollBackVerify){
                        return make_error_response("116")
                    }else{
                       
                        var gameId = await BaseControll.get_gameid(LAUNCHURL,indata.gameId);

                        if (!gameId) {
                            return make_error_response("116")
    
                        } else {
    
                        }

                     var betrow = {
                        AMOUNT : transactionAmount,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "CANCELED_BET",
                        transactionId : indata.transactionId,
                    roundId : indata.gameCycle,
                        userid : mongoose.Types.ObjectId(indata.playerId),
                        betting :{
                            transactionId : indata.transactionId,
                            gameCycle : indata.gameCycle
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };
        
                    var wallets_ = {
                        commission:0,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"CANCELED_BET",
                        userid : mongoose.Types.ObjectId(detailuser.userid),
                        roundid :indata.transactionId,
                        transactionid : indata.transactionId,
                        lastbalance : detailuser.balance,
                        credited : transactionAmount,
                        debited : 0
                    }

                    let sh=    await BaseControll.data_save(betrow , betting_historymodel);
                    if (sh ) {
                        var updatehandle = await player_balanceupdatein(transactionAmount * 1 , indata.playerId , wallets_);
                        if(updatehandle === false){
                            return make_error_response("103")
                        }else{
                            var row={}
                            row['playerId'] = detailuser.id;
                            row['currency'] = "INR";
                            row['balance'] = parseFloat(updatehandle).toFixed(2);
                            row['oldBalance'] = parseFloat(detailuser.balance).toFixed(2);
                            row['transactionId'] = indata.transactionId;
                            row['sessionId'] = indata.sessionId;
                            row['group'] = group;
                            row['timestamp'] = new Date().toISOString();
                            row['requestId'] = indata.requestId;
                            row['fingerprint'] = get_fingerprint(row, indata.privateKey);
                            return make_success_response(row);
                        }
                    } else {
                        return make_error_response("116")

                        }
                    }
                }
            }
        }
    }
}

exports.rollback_api = async (req,res,next) =>{
    console.log("----------------xpress rollback api",req.body);
    var resdata = await rollbackChild(req.body);
    console.log(resdata);
    res.json(resdata);
    return next();
}


async function logoutChild(indata){
    var data = await BaseControll.BfindOne(GameSessionModel,{token : indata.sessionId});
    if(!data){
        return make_error_response("114")
    }else{
        var detailuser = await get_playerdetail(data.id);
        if(!detailuser){
            return make_error_response("103")
        }else{
            var row={};
            row['playerId'] = detailuser.id;
            row['currency'] = "INR";
            row['balance'] = parseFloat(detailuser.balance).toFixed(2);
            row['sessionId'] = indata.sessionId;
            row['group'] = group;
            row['timestamp'] = new Date().toISOString();
            row['requestId'] = indata.requestId;
            row['fingerprint'] = get_fingerprint(row, indata.privateKey);
            return make_success_response(row);
        }
    }
}

exports.logout_api = async (req,res,next) =>{
    console.log("----------------xpress logout api",req.body);
    var resdata = await logoutChild(req.body);
    console.log(resdata);
    res.json(resdata);
    return next();
}