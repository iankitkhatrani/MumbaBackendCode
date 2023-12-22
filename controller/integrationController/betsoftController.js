
const url = require('url');
const o2x = require('object-to-xml');
const USERSMODEL = require("../../models/users_model");
const playersUser = USERSMODEL.GamePlay;
const gamesessionModel = USERSMODEL.gamesessionmodel;
const BASECONTROL = require("./../basecontroller");
const BETSOFTCON = require("../../models/betsoft_model");
const betsoft_bonuswinmodel = BETSOFTCON.betsoft_bonuswinmodel;
const CONFIG = require("../../servers/provider.json");
const passkey = CONFIG.betsoft.passkey;
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
const Bonusbetting_historymodel = require("../../models/bettinghistory_model").BonusBettingHistory_model;
const PVMANAGEconfig = require("../../config/providermanage.json");

const LAUNCHURL = PVMANAGEconfig.launchurl_key.BETSOFT;

// authentication: $HASH= MD5($token$passkey);
// betresult: $HASH = MD5($userid$bet$win$isRoundFinished$roundId$gameId$passkey)
// bonusRelease: $HASH= MD5($userId$bonusId$amount$passkey);
// bonusWin: $HASH= MD5($userId$bonusId$amount$passkey);

async function player_balanceupdatein(amount,username,gameId){
    console.log("----------------------------------------------",amount)
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount,username,gameId,LAUNCHURL);
    if(!outdata){
        return outdata;
    }else{
        return (outdata * 100).toFixed(0);
    }
}

//------------------------functions------------------------//
function XML_CONVERT(request,response){
    var row = {};
    for(var i in request)
    {
        var aa = i.toLocaleUpperCase();
        row[aa] = request[i];
    }
    var results = {};
    results['REQUEST'] = row;
    results['TIME'] = get_time();
    results['RESPONSE'] = response;
    return results;
}

function get_time(){
    return  BASECONTROL.get_time();
}

function urlparse(adr){
    var q = url.parse(adr, true);
    var qdata = q.query;
    return qdata;
}

async function Id_account(userId){
    var outdata = null;
    await playersUser.findOne({id : userId}).then(rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    outdata['balance'] = (outdata['balance'] * 100).toFixed(0);
    return outdata;
}

async function data_save(indata,model){
    var handle = null;
    var savehandle = new model(indata);
    await savehandle.save().then(rdata=>{
        if(!rdata){
            handle = false;
        }else{
            handle = rdata;
        }
    });
    return handle;
}

//-----------------------------authenticate-------------------------------//

exports.authenticate = (req,res,next)=>{
    var qdata = req.body;
    console.log(qdata)
    var hash  = qdata.hash;
    var token = qdata.token;
    console.log("---------------------------------------authenticate")

    authenticate_child(token,hash,function(rdata){
        console.log(rdata);
        res.set('Content-Type', 'text/xml');
        if(rdata.error == true){
            results = XML_CONVERT({TOKEN : token,HASH : hash},{RESULT : "ERROR",CODE : rdata.errorcode});
        }else{
            results = rdata.results;
        }
        res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
    })
    return;
}

async function authenticate_child(token,hash,callback){
    console.log(token)
    var token_f = await session_verify(token);
    console.log(token_f);
    if(!token_f){
        callback({error : true,errorcode : 400})
    }else{
        var ourhash =  BASECONTROL.md5convert(token+passkey);
        if(ourhash == hash){
            var play = await get_account(token_f.email);
            console.log(play)
            if(!play){
                callback({error : true,errorcode : 400});                
            }else{
                var results = XML_CONVERT({ TOKEN : token,HASH : hash},{ RESULT : "OK",USERID : play.id, USERNAME : play.username, FIRSTNAME : play.firstname, LASTNAME : play.lastname,EMAIL : play.email, CURRENCY :  play.currency,BALANCE : play.balance});
                callback({error : false,results : results});
            }
        }else{
            callback({error : true,errorcode : 500});
        }
    }
}

async function session_verify(token){
    var outdata = null;
    var rdata = await BASECONTROL.BfindOne(gamesessionModel,{token :token});
    if(!rdata){
        outdata = false;
    }else {
        outdata = rdata;
    }
    return outdata;
}

async function get_account(email){
    var outdata;
    await playersUser.findOne({email : email}).then( rdata=>{
        if(!rdata){
            outdata = false;
        }else {
            outdata = rdata;
        }
    });
    outdata['balance'] = (outdata['balance'] * 100).toFixed(0);
    return outdata;
}

//-----------------------------------account------------------------------------------//

exports.account = (req,res)=>{

    var inputdata = req.body;
    var userId  = inputdata.userId;
    var hash = inputdata.hash;
    var results = '';
    console.log("--------------account")
    console.time();
    account_child(userId,hash,function(rdata){
        res.set('Content-Type', 'text/xml');
        if(rdata.error == true){
            results = XML_CONVERT({ USERID : userId, HASH : hash},{ RESULT : "ERROR", CODE : rdata.errorcode});
        }else{
            results = rdata.data;
        }
        console.log(results);
        console.timeEnd();
        res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
        
    });
    return;
}

async function account_child(userId,hash,callback){
         var ourhash = BASECONTROL.md5convert(userId + passkey);
    if(hash != ourhash){
        callback({error : true,errorcode : 500});
    }else{
        var rdata = await Id_account(userId)
        if(!rdata){
            callback({error : true,errorcode : 310});
        }else{
            var results = XML_CONVERT({ USERID : userId, HASH : hash},{ RESULT : "OK",USERNAME :  rdata.username,FIRSTNAME : rdata.firstname,LASTNAME : rdata.lastname,EMAIL : rdata.email,CURRENCY : rdata.currency})
            callback({error : false, data : results});
        }
    }
}

//---------------------------------------------betresult------------------------------------//

exports.betresult  = async (req,res)=>{
    var adr = req.url;
    console.log("------betresult");
    var inputdata = req.body;
    console.log(inputdata);
    var results = '';
    console.time();
        if(inputdata.bet){
            console.log("---------bet-----------")
            betresult_child(inputdata,function(rdata){
                res.set('Content-Type', 'text/xml');
                if(rdata.error == true){
                    results = XML_CONVERT(inputdata,{ RESULT : "FAILED", CODE : rdata.errorcode});
                }else{
                    results = rdata.data;
                }
                console.log(results);
                console.timeEnd();
                res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
            })
        }else if(inputdata.win){
            console.log("---------win-----------")        
            winresult_child(inputdata,function(rdata){
                res.set('Content-Type', 'text/xml');
                if(rdata.error == true){
                    results = XML_CONVERT(inputdata,{ RESULT : "FAILED", CODE : rdata.errorcode});
                }else{
                    results = rdata.data;
                }
                console.log(results);
                console.timeEnd();
                res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
            })
        }else{
            console.timeEnd();
            res.set('Content-Type', 'text/xml');
            results = XML_CONVERT(inputdata,{ RESULT : "FAILED", CODE : 310});
            res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
        }
    return;
}

async function betresult_verify(casinoTransactionId,userId){  
    var outdata = null;
    // {casinoTransactionId :casinoTransactionId, userId : userId,type : "BET"}
    await betting_historymodel.findOne({$and:[{LAUNCHURL : LAUNCHURL},{TYPE : "BET"},{USERID : userId},{"betting.casinoTransactionId" : casinoTransactionId}]}).then(rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    return outdata;
}

async function winresult_verify(casinoTransactionId,userId){  
    var outdata = null;

    await betting_historymodel.findOne({$and:[{LAUNCHURL : LAUNCHURL},{TYPE : "WIN"},{USERID : userId},{"betting.casinoTransactionId" : casinoTransactionId}]}).then(rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    return outdata
}

async function betresult_child(inputdata,callback){
    console.log(inputdata)
    var bet = inputdata.bet;
    var gameId = inputdata.gameId;
    var gameSessionId = inputdata.gameSessionId;
    var userId  = inputdata.userId;
    var roundId = inputdata.roundId;
    var hash = inputdata.hash;
    var negativeBet = inputdata.negativeBet;
    var amount = bet.split("|");
    var casinoTransactionId = amount[1];
    var betamount = parseFloat(amount[0]);
    var userdata = await Id_account(userId);
    console.log(userId)
    console.log(userdata)
    if(!userdata){
        callback({error : true,errorcode : 310 })
    }else{
        var lastamount = userdata.balance;
        if(negativeBet){
            betamount +=parseFloat(negativeBet);
        }
        console.log('------betamount',betamount/100,lastamount);
        var rebetamount = betamount/100;
        if(lastamount/100 < rebetamount){
            callback({error : true,errorcode : 300 });
        }else{
            var lastbetdata = await betresult_verify(casinoTransactionId,userId);
            if(!lastbetdata){
                var newdata = {
                    roundId: roundId,
                    userId: userId,
                    gameId : gameId,
                    gameSessionId: gameSessionId,
                    hash: hash,
                    amount: rebetamount,
                    casinoTransactionId: amount[1],
                    transactionId : (new Date()).valueOf(),
                };
                newdata['prevbalance'] = userdata.balance /100

                var row = {
                    GAMEID : gameId,
                    LAUNCHURL : LAUNCHURL,
                    AMOUNT : rebetamount,
                    TYPE : "BET",
                    USERID : userId,
                    betting : newdata
                };
                
                var savehandle = await data_save(row,betting_historymodel);
                if(!savehandle){
                    callback({error : true,errorcode : 399 });
                }else{
                    console.log("---------------------------------------ffffffff",rebetamount*-1,userId)
                    var updatehandle = await player_balanceupdatein(rebetamount * -1,userId,gameId);
                    console.log(updatehandle);
                    if(!updatehandle){
                        callback({error : true,errorcode : 300 });
                    }else{
                        var resultsvalue =  XML_CONVERT(inputdata,{RESULT : "ok",EXTSYSTEMTRANSACTIONID : row.betting['transactionId'],BALANCE :Math.abs(updatehandle)});
                        callback({error : false,data : resultsvalue });
                    }
                }
            }else{
                var results =  XML_CONVERT(inputdata,{RESULT : "ok",EXTSYSTEMTRANSACTIONID : lastbetdata.betting['transactionId'],BALANCE : userdata.balance});
                callback({error : false,data : results });
            }
        }
    }
    
}

async function winresult_child(inputdata,callback){
    console.log(inputdata);
    var win = inputdata.win;
    var gameId = inputdata.gameId;
    var gameSessionId = inputdata.gameSessionId;
    var userId  = inputdata.userId;
    var roundId = inputdata.roundId;
    var hash = inputdata.hash;
    var negativeBet = inputdata.negativeBet;
    var amount = win.split("|");
    var casinoTransactionId = amount[1];
    var winamount = parseFloat(amount[0]);

    var userdata = await Id_account(userId);
    if(!userdata){
        callback({error : true,errorcode : 310 })
    }else{
        var lastamount = userdata.balance;
        if(negativeBet){
            winamount +=parseFloat(negativeBet);
        }
        console.log('------winamount',winamount);
        var rewinamount = winamount/100;

        var lastbetdata = await betresult_verify(casinoTransactionId,userId);
        if(!lastbetdata){
            var lastwindata = await winresult_verify(casinoTransactionId,userId);
            if(!lastwindata){
                var newdata = {
                    roundId: roundId,
                    userId: userId,
                    gameId : gameId,
                    gameSessionId: gameSessionId,
                    hash: hash,
                    amount: rewinamount,
                    casinoTransactionId: amount[1],
                    transactionId : (new Date()).valueOf(),
                };

                newdata['prevbalance'] = userdata.balance/100

                var row = {
                    GAMEID : gameId,
                    LAUNCHURL : LAUNCHURL,
                    AMOUNT : rewinamount,
                    TYPE : "WIN",
                    USERID : userId,
                    betting : newdata
                };

                var savehandle = await data_save(row,betting_historymodel);
                if(!savehandle){
                    callback({error : true,errorcode : 399 });
                }else{
                    var updatehandle = await player_balanceupdatein(rewinamount,userId,gameId);
                    if(!updatehandle){
                        callback({error : true,errorcode : 300 });
                    }else{
                        var resultsvalue =  XML_CONVERT(inputdata,{RESULT : "ok",EXTSYSTEMTRANSACTIONID : row.betting['transactionId'],BALANCE :Math.abs(updatehandle)});
                        callback({error : false,data : resultsvalue });
                    }
                }
            }else{
                var results =  XML_CONVERT(inputdata,{RESULT : "ok",EXTSYSTEMTRANSACTIONID : lastwindata.betting['transactionId'],BALANCE : userdata.balance});
                callback({error : false,data : results });
            }
        }else{
            var results =  XML_CONVERT(inputdata,{RESULT : "ok",EXTSYSTEMTRANSACTIONID : lastbetdata.betting['transactionId'],BALANCE : userdata.balance});
            callback({error : false,data : results });
        }
    }
}

//--------------------------------------------refundbet------------------------------------------

exports.refundBet= (req,res)=>{
    var adr = req.url;
    var inputdata = req.body;
    console.time();
    console.log(inputdata);
    var results = '';
    refundBet_child(inputdata,function(rdata){
        console.log("--------------refundbet",rdata);
        res.set('Content-Type', 'text/xml');
        if(rdata.error == true){
            results = XML_CONVERT(inputdata,{ RESULT : "FAILED", CODE : rdata.errorcode});
        }else{
            results = rdata.data;
        }
        console.log(results);
        console.timeEnd();
        res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
        
    })
    return;
}

async function refundBet_verify(userId,casinoTransactionId){
    var outdata = null;
    // {userId : userId,casinoTransactionId : casinoTransactionId,type : "CANCELED_BET"}
    // {$and:[{LAUNCHURL : LAUNCHURL},{TYPE : "WIN"},{USERID : userId},{betting :{$elemMatch : {casinoTransactionId : casinoTransactionId}}} ]}
    await betting_historymodel.findOne({$and:[{LAUNCHURL : LAUNCHURL},{TYPE : "CANCELED_BET"},{USERID : userId},{"betting.casinoTransactionId" : casinoTransactionId}]}).then(rdata=>{
        if(!rdata){
            outdata = false
        }else{
            outdata = rdata
        }
    });
    return outdata
}

async function refundBet_child(inputdata,callback)
{
    var userId = inputdata.userId;
    var casinoTransactionId = inputdata.casinoTransactionId;
    var hash = inputdata.hash;
    var hashhandle = BASECONTROL.md5convert(userId+casinoTransactionId + passkey);
    if(hashhandle != hash){
        callback({error : true,errorcode : 500 })
    }else{
        var userdata = await Id_account(userId)
        if(!userdata){
            callback({error : true,errorcode : 310});
        }else{
            var lastbetdata =  await betresult_verify(casinoTransactionId,userId);
            if(!lastbetdata){
                callback({error : true,errorcode : 302});
            }else{
            var lastbethandle =  await refundBet_verify(userId,casinoTransactionId)
                if(!lastbethandle){
                    var extSystemTransactionId = (new Date()).valueOf();
                    var lastamount = lastbetdata.betting.amount;
                    var refunddata = {
                        userId : userId,
                        casinoTransactionId : casinoTransactionId,
                        extSystemTransactionId : extSystemTransactionId,
                        hash : hash,
                    }

                    refunddata['prevbalance'] = userdata.balance/100;

                    var row = {
                        GAMEID : lastbetdata.GAMEID,
                        LAUNCHURL : LAUNCHURL,
                        AMOUNT : lastamount,
                        TYPE : "CANCELED_BET",
                        USERID : userId,
                        betting : refunddata
                    };

                    var refundhandle = await data_save(row,betting_historymodel);
                    if(!refundhandle){
                        callback({error : true,errorcode : 399});
                    }else{
                       var updatehandle =await  player_balanceupdatein(lastamount,userId,lastbetdata.GAMEID);
                        if(!updatehandle){
                            callback({error : true,errorcode : 300 });
                        }else{
                            var results =  XML_CONVERT(inputdata,{RESULT : "ok",EXTSYSTEMTRANSACTIONID :lastbetdata.betting.transactionId ,BALANCE : updatehandle});
                            callback({error : false,data : results });
                        }
                    }
                }else{
                    var results =  XML_CONVERT(inputdata,{RESULT : "ok",EXTSYSTEMTRANSACTIONID :lastbetdata.betting.transactionId ,BALANCE : userdata.balance});
                    callback({error : false,data : results });                            
                }
            }
        }
    }
}

exports.getBalance= (req,res)=>{
    var adr = req.url;
    console.log(adr);
    var inputdata =  req.body;
    console.log(inputdata);

    playersUser.findOne({id : inputdata.userId}).then(rdata=>{
        res.set('Content-Type', 'text/xml');
        if(!rdata){
            results = XML_CONVERT(inputdata,{ RESULT : "FAILED", CODE : 699});
        }else{
            results = XML_CONVERT(inputdata,{ RESULT : "OK",BALANCE : rdata.balance});
        }
        res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
        
    });
    return;
}

exports.getAccountInfo =  async (req,res)=>{
    var adr = req.url;
    console.log(adr);
    var inputdata = req.body;
    console.log(inputdata);
    var results = "";
    var userId = inputdata.userId;
    var hash = inputdata.hash;
    var hashhandle = BASECONTROL.md5convert(userId + passkey);
    if(hash !== hashhandle){
        callback({error : true,errorcode : 500 })
    }else{
        var userdata = await Id_account(inputdata.userId)
            res.set('Content-Type', 'text/xml');
            if(!userdata){
                results = XML_CONVERT(inputdata,{ RESULT : "FAILED", CODE : 300});
            }else{
                results = XML_CONVERT(inputdata,{ RESULT : "OK",USERID : userdata.id, USERNAME : userdata.username, FIRSTNAME : userdata.firstname, LASTNAME : userdata.lastname,EMAIL : userdata.email, CURRENCY :  userdata.currency,BALANCE : userdata.balance});
            }
            res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
    }
    return;
}

exports.bonusWin = (req,res)=>{
    var adr = req.url;
    var inputdata = req.body;
    console.log(inputdata);
    
    Bonus_child(inputdata,function(rdata){
        console.log("--------------Bonuswin",rdata)
        res.set('Content-Type', 'text/xml');
        if(rdata.error == true){
            results = XML_CONVERT(inputdata,{ RESULT : "FAILED", CODE : rdata.errorcode});
        }else{
            results = rdata.data;
        }
        console.log(results);
        res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
        
    })
    return;
}

async function Bonusmodel_verify(transactionId,userId)
{
    // var outdata = null;
    // await betsoft_bonuswinmodel.findOne({transactionId : transactionId}).then(rdata=>{
    //     if(!rdata){
    //         outdata = false;
    //     }else{
    //         outdata = rdata;
    //     }
    // });
    // return outdata;
    var outdata = null;
    await BonusBettingHistory_model.findOne({$and:[{LAUNCHURL : LAUNCHURL},{TYPE : "BET"},{USERID : userId},{"betting.transactionId" : transactionId}]}).then(rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    return outdata;
}

async function Bonus_child(inputdata,callback){
    var userId = inputdata.userId;
    var transactionId = inputdata.transactionId;
    var hash = inputdata.hash;
    var bonusId = inputdata.bonusId;
    var amount  = parseFloat(inputdata.amount);
    var hash_ = BASECONTROL.md5convert(userId+bonusId+inputdata.amount+passkey)
    if(hash != hash_){
        callback({error : true,errorcode : 500 })
    }else{
        var rebetamount  = amount/100;
       var userdata = await  Id_account(userId);
        if(!userdata){
            callback({error : true,errorcode : 310 })
        }else{
            var bonushandle = await Bonusmodel_verify(transactionId,userId)
            if(!bonushandle){
                var row = {
                    GAMEID : lastbetdata.GAMEID,
                    LAUNCHURL : LAUNCHURL,
                    AMOUNT : rebetamount,
                    TYPE : "BET",
                    USERID : userId,
                    betting : inputdata
                };

                var bonussavehandle = await data_save(row,betsoft_bonuswinmodel);
                if(!bonussavehandle){
                    callback({error : true,errorcode : 300 });
                }else{
                    var updatehandle = await player_balanceupdatein(rebetamount,userId)
                    if(!updatehandle){
                        callback({error : true,errorcode : 300 });
                    }else{
                        var results =  XML_CONVERT(inputdata,{RESULT : "ok",BALANCE : updatehandle});
                        callback({error : false,data : results });
                    }
                }
            }else{
                var results =  XML_CONVERT(inputdata,{RESULT : "ok",BALANCE : userdata.balance});
                callback({error : false,data : results });
            }
        }
    }
}

exports.bonusRelease = (req,res)=>{
    var adr = req.url;
    var inputdata = req.body;
    
    BonusRelease_child(inputdata,function(rdata){
        res.set('Content-Type', 'text/xml');
        if(rdata.error == true){
            results = XML_CONVERT(inputdata,{ RESULT : "FAILED", CODE : rdata.errorcode});
        }else{
            results = rdata.data;
            
        }
        console.log(results);
        res.send(o2x({'?xml version="1.0" encoding="iso-8859-1"?' : null,EXTSYSTEM: results}));
        
    })
}

//amount:1; bonusId:1416783081; userId:63; hash:deab6a92f6908d153ecc31efc0c9e6fb; 
async function BonusReleasemodel_verify(transactionId)
{
    var outdata = null;
    await betsoft_bonuswinmodel.findOne({bonusId : transactionId,type : "CANCELED_BET"}).then(rdata=>{
        if(!rdata){
            outdata = false;
        }else{
            outdata = rdata;
        }
    });
    return outdata;
}

async function BonusRelease_child(inputdata,callback){
    var userId = inputdata.userId;
    var hash = inputdata.hash;
    var bonusId = inputdata.bonusId;
    var hash_ = md5convert(userId+bonusId+inputdata.amount+passkey)
    if(hash != hash_){
        callback({error : true,errorcode : 500 })
    }else{
        var userdata = await Id_account(userId);
            if(!userdata){
                callback({error : true,errorcode : 310 })
            }else{
                var bonushandle = await BonusReleasemodel_verify(bonusId)
                if(!bonushandle){
                    inputdata['type'] = "CANCELED_BET"
                    var bonussavehandle = await data_save(inputdata,betsoft_bonuswinmodel);
                    if(!bonussavehandle){
                        callback({error : true,errorcode : 300 });
                    }else{
                        var updatehandle = await player_balanceupdatein(inputdata.amount,userId);
                        if(!updatehandle){
                            callback({error : true,errorcode : 300 });
                        }else{
                            var results =  XML_CONVERT(inputdata,{RESULT : "ok",BALANCE : updatehandle});
                            callback({error : false,data : results });
                        }
                    }
                }else{
                    var results =  XML_CONVERT(inputdata,{RESULT : "ok",BALANCE : userdata.balance});
                    callback({error : false,data : results });
                }
            }
    }
}


// router.post("/awardapi",(req,res)=>{

//     var userId = req.body.userId;
//     var bankId = "5368";
//     var rounds = req.body.rounds;
//     var games = req.body.games;
//     var extBonusId = (new Date()).valueOf();
//     var hash = md5convert(userId+bankId+rounds+games+extBonusId+passkey);
//     var options = {
//         'method': 'GET',
//         'url': 'https://mobiwalkers-gp3.discreetgaming.com/frbaward.do?userId='+userId+'&bankId='+bankId+'&rounds='+rounds+'&games='+games+'&extBonusId='+extBonusId+'&hash='+hash,
//         'headers': {
//             'Cookie': 'JSESSIONID=node0h7allyjpuos6wb1amzubpczq293219.node0'
//         }
//     };
//     request(options, function (error, response) {
//       if (error) throw new Error(error);
//       console.log(response.body);
//     });
// })

//award apihttps://mobiwalkers-gp3.discreetgaming.com/frbaward.do?userId=5f0aafebea22fe58997789ca&bankId=5368&rounds=50&games=827&extBonusId=1234567&hash=7f8413409396b2e1aeda1d16fc61fdbf
//785071049
