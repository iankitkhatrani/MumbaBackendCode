const BASECONTROL = require("./../basecontroller");
const playersUser = require("../../models/users_model").GamePlay;
const gamesessionModel = require("../../models/users_model").gamesessionmodel;
const betconfig = require("../../servers/provider.json");
const PVMANAGEconfig = require("../../config/providermanage.json");
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
const projectId = betconfig.EVOPLAY.projectId;
const secret_key = betconfig.EVOPLAY.secret_key;
const apiVersion = betconfig.EVOPLAY.apiVersion;
const LAUNCHURL = PVMANAGEconfig.launchurl_key.EVOPLAY

async function player_balanceupdatein(amount,userId,wallets_){
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount,userId,wallets_);
    if(!outdata){
        return false;
    }else{
        return outdata.toFixed(0);
    }
}


exports.api = async(req,res,next)=>{

    console.log("-------------------------evoplay controller------------------------------------------");
    var indata = req.body;
    console.log(indata);
    var name = indata.name;
    var token = indata.token;
    var session = await BASECONTROL.BfindOne(gamesessionModel,{token : token});
    if (session){
        var userdata = await BASECONTROL.PlayerFindByemail( session.email);
        userdata.balance = parseInt(userdata.balance.toFixed(0));
        switch(name){
            case "init":
                this.init(req,res,next,userdata);
                break;
            case "bet":
                this.bet(req,res,next,userdata);
                break;
            case "win":
                this.win(req,res,next,userdata);
                break;
            case "refund":
                this.refund(req,res,next,userdata);
                break;
        }
    }else{
        res.json({ "status": "error",
        "error":
        {
            "scope": "user",
            "no_refund": "1",
            "message": "Not enough money"
        }
        });
        return next();
    }
}

exports.init = async (req,res,next,userdata) =>{
    var indata = req.body;
    var newsignature = BASECONTROL.md5convert(projectId +"*"+ apiVersion +"*"+ indata.token +"*"+ indata.callback_id +"*"+ indata.name +"*"+ projectId+"*" + secret_key);
    var lastsignature = indata.signature;
    if ( newsignature == lastsignature){
        res.json({
            status : "ok",
            data  :{
                balance : userdata.balance,
                currency : "INR"
            }
        });
        return next();
    } else{
        res.json({ "status": "error",
            "error":
            {
                "scope": "user",
                "no_refund": "1",
                "message": "Not enough money"
            }
        });
        return next();
    }
}

exports.bet = async (req,res,next,userdata) =>{
    var indata = req.body.data;
    var rdata = req.body;
    var round_id = indata.round_id;
    var action_id = indata.action_id;
    var amount = indata.amount;
    var game_id = JSON.parse(indata.details).game.game_id;
    var userId = userdata.id;
    var balance = userdata.balance;
    console.log(indata);    
    
    var newsignature = BASECONTROL.md5convert(projectId +"*"+ apiVersion +"*"+  rdata.token +"*"+ rdata.callback_id +"*"+ rdata.name+"*" +
    round_id + ":" + action_id + ":" + indata.amount + ":" +  indata.currency  + ":" +indata.details + "*" + projectId + "*" + secret_key);
    var lastsignature = rdata.signature;
    if (newsignature == lastsignature){
        console.log("-----------process bet -------------------")
        console.log(newsignature,lastsignature);
        console.log("-----------process bet -------------------")
        var lastbet = await is_exist_transaction(round_id,"BET",userId);
        if (!lastbet){
            amount = parseInt(parseFloat(amount).toFixed(0));
            if (amount <= balance ){
                var betdata = Object.assign({},{round_id : round_id},{detail : indata},{prevbalance :balance} ,{action_id : action_id});
                var row = {
                    GAMEID : game_id,
                    LAUNCHURL : LAUNCHURL,
                    AMOUNT : amount,
                    TYPE : "BET",
                    USERID : userId,
                    betting : betdata
                };            
                var savehandle = await BASECONTROL.data_save(row,betting_historymodel);
                if (savehandle){
                    var wallets_ = {
                        commission:0,
                        GAMEID : game_id,
                        LAUNCHURL :LAUNCHURL,
                        status :"BET",
                        USERID : userId,
                        roundid :round_id,
                        transactionid : round_id,
                        lastbalance : balance,
                        credited : 0,
                        debited : amount
                    }
                   var updatehandle = await player_balanceupdatein(amount * -1,userId,wallets_);
                        res.json({
                        status : "ok",
                        data  :{
                            balance : updatehandle,
                            currency : "INR"
                        }
                    });
                    return next();
                }else{
                    res.json({ "status": "error",
                    "error":
                    {
                        "scope": "user",
                        "no_refund": "1",
                        "message": "Not enough money"
                    }
                });
                return next();
                }
            }else{
                res.json({ "status": "error",
                "error":
                {
                    "scope": "user",
                    "no_refund": "1",
                    "message": "Not enough money"
                }
            });
            return next();
            }
        }else{
            res.json({
                status : "ok",
                data  :{
                    balance : balance,
                    currency : "INR"
                }
            });
            return next();
        }
    }else{
        res.json({ "status": "error",
        "error":
        {
            "scope": "user",
            "no_refund": "1",
            "message": "Not enough money"
        }
    });
    return next();
    }
}


exports.win = async (req,res,next,userdata) =>{
    var indata = req.body.data;
    var round_id = indata.round_id;
    var action_id = indata.action_id;
    var final_action = indata.final_action;
    var rdata = req.body;

    var amount = parseInt(indata.amount);
    var game_id = JSON.parse(indata.details).game.game_id;
    var userId = userdata.id;
    var balance = userdata.balance;
    console.log(rdata.token);
    console.log(rdata.callback_id);
    console.log(rdata.name);
    console.log(round_id);
    console.log(action_id);


    var newsignature = BASECONTROL.md5convert(projectId +"*"+ apiVersion +"*"+ 
    rdata.token +"*"+ rdata.callback_id +"*"+ rdata.name+"*" +
    round_id + ":" + action_id + ":" +final_action + ":" + indata.amount + ":" +  indata.currency  + ":" +indata.details +  "*" + projectId +"*" + secret_key);
    var lastsignature = rdata.signature;
    console.log("-----------process win -------------------")
    console.log(newsignature,lastsignature);
    console.log("-----------process win -------------------")
    if (newsignature == lastsignature){
        var lastwin = await is_exist_transaction(round_id,"WIN",userId);
        if (!lastwin){
            var lastbet = await is_exist_transaction(round_id,"BET",userId);
            if (lastbet){
                    amount = parseFloat(amount).toFixed(0)
                    var betdata = Object.assign({},{round_id : round_id},{detail : indata},{prevbalance :balance} ,{action_id : action_id});
                    var row = {
                        GAMEID : game_id,
                        LAUNCHURL : LAUNCHURL,
                        AMOUNT : amount,
                        TYPE : "WIN",
                        USERID : userId,
                        betting : betdata
                    };            
                    var savehandle = await BASECONTROL.data_save(row,betting_historymodel);
                    if (savehandle){
                        var wallets_ = {
                            commission:0,
                            GAMEID : game_id,
                            LAUNCHURL :LAUNCHURL,
                            status :"WIN",
                            USERID : userId,
                            roundid :round_id,
                            transactionid : round_id,
                            lastbalance : balance,
                            credited : amount,
                            debited : 0
                        }
                        var updatehandle = await player_balanceupdatein(amount ,userId,wallets_);
                            res.json({
                                status : "ok",
                                data  :{
                                    balance : updatehandle,
                                    currency : "INR"
                                }
                            });
                            return next();
                      
                    }else{
                        res.json({ "status": "error",
                            "error":
                            {
                                "scope": "user",
                                "no_refund": "1",
                                "message": "Not enough money"
                            }
                        });
                        return next()
                    }
            }else{
                res.json({ "status": "error",
                    "error":
                    {
                        "scope": "user",
                        "no_refund": "1",
                        "message": "Not enough money"
                    }
                });
                return next()
            }
        } else{
            res.json({
                status : "ok",
                data  :{
                    balance : balance,
                    currency : "INR"
                }
            });
            return next();
        }

    }else{
        res.json({ "status": "error",
            "error":
            {
                "scope": "user",
                "no_refund": "1",
                "message": "Not enough money"
            }
        });
        return next()
    }
}

exports.refund = async (req,res,next,userdata) =>{
    var indata = req.body.data;
    var round_id = indata.refund_round_id;
    var action_id = indata.refund_action_id;
    var refund_callback_id = indata.refund_callback_id;
    var rdata = req.body;
    
    var amount = indata.amount;
    var game_id = JSON.parse(indata.details).game.game_id;
    var userId = userdata.id;
    var balance = userdata.balance;

    var newsignature = BASECONTROL.md5convert(projectId +"*"+ apiVersion +"*"+ 
    rdata.token +"*"+ rdata.callback_id +"*"+ rdata.name+"*" +
    round_id + ":" + action_id + ":" +refund_callback_id + ":" + indata.amount + ":" + indata.currency + ":" +indata.details + "*" + projectId + "*" + secret_key);
    var lastsignature = rdata.signature;
    console.log("-----------process refund -------------------")
    console.log(newsignature,lastsignature);
    console.log("-----------process refund -------------------");
    if (newsignature == lastsignature){

        var lastwin = await is_exist_transaction(round_id,"CANCELED_BET",userId);
        if (!lastwin){
            var lastbet = await is_exist_transaction(round_id,"BET",userId);
            if (lastbet){
                amount = parseFloat(amount).toFixed(0)
                var betdata = Object.assign({},{round_id : round_id},{detail : indata},{prevbalance :balance} ,{action_id : action_id});
                var row = {
                    GAMEID : game_id,
                    LAUNCHURL : LAUNCHURL,
                    AMOUNT : amount,
                    TYPE : "CANCELED_BET",
                    USERID : userId,
                    betting : betdata
                };            
                var savehandle = await BASECONTROL.data_save(row,betting_historymodel);
                if (savehandle){
                    var wallets_ = {
                        commission:0,
                        GAMEID : game_id,
                        LAUNCHURL :LAUNCHURL,
                        status :"CANCELED_BET",
                        USERID : userId,
                        roundid :round_id,
                        transactionid : round_id,
                        lastbalance : balance,
                        credited : amount,
                        debited : 0
                    }
                    var updatehandle = await player_balanceupdatein(amount ,userId,wallets_);
                    
                        res.json({
                            status : "ok",
                            data  :{
                                balance : updatehandle,
                                currency : "INR"
                            }
                        });
                        return next();
                   
                   
                }else{
                    res.json({
                        status : "ok",
                        data  :{
                            balance : balance,
                            currency : "INR"
                        }
                    });
                    return next();
                }
            }else{
                res.json({
                    status : "ok",
                    data  :{
                        balance : balance,
                        currency : "INR"
                    }
                });
                return next();
            }
        } else{
            res.json({
                status : "ok",
                data  :{
                    balance : balance,
                    currency : "INR"
                }
            });
            return next();
        }
    }else{
        res.json({
            status : "ok",
            data  :{
                balance : balance,
                currency : "INR"
            }
        });
        return next();
    }
}


async function is_exist_transaction(round_id,type,userId){
    var outdata = null;
    await betting_historymodel.findOne({$and:[{LAUNCHURL : LAUNCHURL},{TYPE : type},{USERID : userId},{"betting.round_id" : round_id}]}).then(rdata=>{
        if (!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    return outdata;
}