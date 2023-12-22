const mongoose = require('mongoose');
const BASECONTROL = require("./../basecontroller");
const PVMANAGEconfig = require("../../config/providermanage.json");
const Users = require("../../models/users_model")
const GameSessionModel = Users.gamesessionmodel;
const PlayerModel = Users.GamePlay;
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
const LAUNCHURL = PVMANAGEconfig.launchurl_key.WINNERPOKER;

async function player_balanceupdatein(amount,username,wallet){
    var outdata = await BASECONTROL.player_balanceupdatein_Username(amount,username,wallet,LAUNCHURL);
    if(outdata < 0){
        return false;
    }else{
        return parseFloat(outdata).toFixed(2);
    }
}

async function get_playerdetail(id){
    var data = await BASECONTROL.playerFindByid(id);
    if(data){
        return data;
    }else{
        return false;
    }
}

function make_error_response(errorcode){
    return{
        status: false,
        code: errorcode,
        message: BASECONTROL.winnerpoker_return_errorstring(errorcode)
    }
}

function make_success_response(data){
    return {
        status: true,
        code : 200,
        data: data
    }
}

async function authenticateChild(indata){
    var data = await BASECONTROL.BfindOne(GameSessionModel,{token : indata.token});
    if(!data){
        return make_error_response("303")
    }else{
        var detailuser = await get_playerdetail(data.id);
        if(!detailuser){
            return make_error_response("304")
        }else{
            var row={};            
            row['playerId'] = detailuser.id;
            row['playerName'] = detailuser.username;
            row['currency'] = "INR";
            row['balance'] = parseFloat(detailuser.balance).toFixed(2);
            row['token'] = indata.token;
            return make_success_response(row);
        }
    }
}

exports.authenticate = async (req,res,next) =>{
    var resdata = await authenticateChild(req.body);
    res.json(resdata);
    return next();
}

async function debitChild(indata){
    var detailuser = await get_playerdetail(indata.playerId);
    if(!detailuser){
        return make_error_response("304")
    }else{
        if(indata.debitMoney <= detailuser.balance){
            var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.gamereference);
            var history = {
                AMOUNT : indata.debitMoney,
                TYPE : "BET",
                LAUNCHURL : LAUNCHURL,
                userid : mongoose.Types.ObjectId(indata.playerId),
                betting : {
                    prevbalance : detailuser.balance,
                    TransactionID : indata.transactionID
                },
                gameid : mongoose.Types.ObjectId(gameId.gameid),
                providerid : mongoose.Types.ObjectId(gameId.providerid),
            };
            var savehandle = await BASECONTROL.data_save(history,betting_historymodel);
            if(savehandle){
                var wallets_ = {
                    commission:0,
                    gameid : mongoose.Types.ObjectId(gameId.gameid),
                    status : "BET",
                    userid : mongoose.Types.ObjectId(indata.playerId),
                    roundid :indata.transactionID,
                    transactionid : indata.transactionID,
                    lastbalance : detailuser.balance,
                    credited : 0,
                    debited : indata.debitMoney
                }
                var updatehandle = await player_balanceupdatein(indata.debitMoney * -1 , detailuser.username, wallets_);
                if(updatehandle === false){
                    return make_error_response("304")
                }else{
                    var row={
                        'balance' : parseFloat(updatehandle).toFixed(2),
                        'playerName' : detailuser.username
                    };
                    return make_success_response(row);
                }
            }else{
                return make_error_response("304");
            }
        }else{
            return make_error_response("305")
        }
    }
}

exports.debit = async (req,res,next) =>{
    var resdata = await debitChild(req.body);
    res.json(resdata);
    return next();
}

async function creditChild(indata){
    var detailuser = await get_playerdetail(indata.playerId);
    if(!detailuser){
        return make_error_response("304")
    }else{
        var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.gamereference);
        var history = {
            AMOUNT : indata.creditMoney,
            TYPE : "WIN",
            LAUNCHURL : LAUNCHURL,
            userid : mongoose.Types.ObjectId(indata.playerId),
            betting : {
                prevbalance : detailuser.balance,
                TransactionID : indata.transactionID
            },
            gameid : mongoose.Types.ObjectId(gameId.gameid),
            providerid : mongoose.Types.ObjectId(gameId.providerid),
        };
        var savehandle = await BASECONTROL.data_save(history,betting_historymodel);
        if(savehandle){
            var wallets_ = {
                commission:0,
                gameid : mongoose.Types.ObjectId(gameId.gameid),
                status : "WIN",
                userid : mongoose.Types.ObjectId(indata.playerId),
                roundid :indata.transactionID,
                transactionid : indata.transactionID,
                lastbalance : detailuser.balance,
                credited : indata.creditMoney,
                debited : 0
            }
            var updatehandle = await player_balanceupdatein(indata.creditMoney , detailuser.username, wallets_);
            if(updatehandle === false){
                return make_error_response("304")
            }else{
                var row={
                    'balance' : parseFloat(updatehandle).toFixed(2),
                    'playerName' : detailuser.username
                };
                return make_success_response(row);
            }
        }else{
            return make_error_response("304");
        }
    }
}

exports.credit = async (req,res,next) =>{
    var resdata = await creditChild(req.body);
    res.json(resdata);
    return next();
}

const updateSessionChild = async (playerId) => {
    var detailuser = await get_playerdetail(playerId);
    BASECONTROL.sesssion_update_username(detailuser.username);
}

exports.updateSession = async (req , res , next) => {
    const { playerId } = req.body;
    var sessionResult = await updateSessionChild(playerId);
    res.json({ status : sessionResult });
    return next();
}