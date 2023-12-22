const BASECONTROL = require("../basecontroller")
const betconfig = require("../../servers/provider.json");
const PVMANAGEconfig = require("../../config/providermanage.json");
const o2x = require('object-to-xml');
const USERSMODEL = require("../../models/users_model");
const gamesessionModel = USERSMODEL.gamesessionmodel;
const playersUser = USERSMODEL.GamePlay;
const LAUNCHURL = PVMANAGEconfig.launchurl_key.BETGAMES;
const CONFIG = betconfig.betgames;
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
const BonusBettingHistory_model = require("../../models/bettinghistory_model").BonusBettingHistory_model;
var mongoose = require('mongoose');


async function player_balanceupdatein(amount, userId, wallets) {
    console.log("----------------------------------------------", amount)
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount, userId, wallets);
    if (!outdata) {
        return false;
    } else {
        var balance = ((outdata * 100).toFixed(0));
        return balance;
    }
}


async function session_verify(token) {
    var outdata = null;
    var rdata = await BASECONTROL.BfindOne(gamesessionModel, { token: token });
    if (!rdata) {
        return false;
    } else {
        outdata = await BASECONTROL.PlayerFindByemail(rdata.email);
        if (!outdata) {
            return false;
        } else {
            outdata.balance = parseFloat(outdata.balance.toFixed(2));
            return outdata;
        }
    }
}

function convert_params_tostring1(params) {
    var string = "";
    if (!params || params == "") {
        return string;
    } else {
        for (var i in params) {
            string += i + params[i];
        }
        return string;
    }
}

function convert_params_tostring(params) {
    var string = "";
    if (!params || params == "") {
        return string;
    } else {
        for (var i in params) {
            string += i;
            if (params[i].length > 1) {
                for (var j in params[i]) {

                    var params2 = params[i][j];
                    for (var k in params2) {
                        if (isNaN(k)) {
                            string += k;
                            var params3 = params2[k][0];
                            for (var l in params3) {
                                if (isNaN(l)) {
                                    string += l + params3[l][0];
                                } else {
                                    string += params3[l][0];
                                }
                            }
                        } else {
                            string += params2[k];
                        }
                    }

                }
            } else {
                for (var j in params[i][0]) {
                    if (isNaN(j)) {
                        string += j + params[i][0][j][0];
                    } else {
                        string += params[i][0][j][0];
                    }
                }
            }

        }
        return string;
    }
}

function get_signature(header, params, passkey) {
    var params1 = convert_params_tostring1(header);
    var params2 = convert_params_tostring1(params);
    var hashstring = BASECONTROL.md5convert(params1 + params2 + passkey);
    return hashstring;
}

function get_time() {
    var time = parseInt(new Date().valueOf() / 1000);
    return time;
}

async function is_exist_lastbet(transaction_id, userId, type) {
    var outdata = null;
    await betting_historymodel.findOne({ $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: type }, { userid: userId }, { "betting.transaction_id": transaction_id }] }).then(rdata => {
        if (!rdata) {
            outdata = false;
        } else {
            outdata = rdata;
        }
    });
    return outdata;
}

async function is_exist_lastbet1(bet_id, userId, type) {
    var outdata = null;
    await betting_historymodel.findOne({ $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: type }, { userid: userId }, { "betting.bet_id": bet_id.toString() }] }).then(rdata => {
        if (!rdata) {
            outdata = false;
        } else {
            outdata = rdata;
        }
    });
    return outdata;
}

async function is_exist_subscriptionbet(subscription_id, userId, type) {
    var outdata = null;
    await betting_historymodel.findOne({ $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: type }, { userid: userId }, { "betting.subscription_id": subscription_id.toString() }] }).then(rdata => {
        if (!rdata) {
            outdata = false;
        } else {
            outdata = rdata;
        }
    });
    return outdata;
}

async function is_exist_combinationnbet(combination_id, userId, type) {
    var outdata = null;
    await betting_historymodel.findOne({ $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: type }, { userid: userId }, { "betting.combination_id": combination_id.toString() }] }).then(rdata => {
        if (!rdata) {
            outdata = false;
        } else {
            outdata = rdata;
        }
    });
    return outdata;
}

async function is_exist_promo_transactionwin(promo_transaction_id, userId, type) {
    var outdata = null;
    await BonusBettingHistory_model.findOne({ $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: type }, { userid: userId }, { "betting.promo_transaction_id": promo_transaction_id }] }).then(rdata => {
        if (!rdata) {
            outdata = false;
        } else {
            outdata = rdata;
        }
    });
    return outdata;
}

exports.response = async (req, res, next, success, error_code, error_text, send_params) => {
    var data = req.body.root;
    var method = data.method[0];
    var token = data.token[0];
    var time = data.time[0];
    var send = null;
    var row = {}
    send = send_params;

    let con = await BASECONTROL.getCredentialFunc("BETGAMESCREDENTIAL")
    if (con) {
        // let apicode = con.apicode
        let passkey = con.passkey
        var signature = get_signature({ method: method, token: token, success: success, error_code: error_code, error_text: error_text, time: time }, send_params, passkey);
        if (send_params) {
            row = Object.assign({}, { method }, { token }, { success: success }, { error_code: error_code }, { error_text: error_text }, { time }, { params: send_params }, { signature: signature });
        } else {
            row = Object.assign({}, { method }, { token }, { success: success }, { error_code: error_code }, { error_text: error_text }, { time }, { signature: signature });
        }
        console.log(row, "--------------------------------------------")
        res.set('Content-Type', 'text/xml');
        res.send(o2x({ '?xml version="1.0" encoding="UTF-8"?': null, root: row }));

    } else {

    }
    // return next();     
}

exports.check_hash = async (req, res, next) => {


    let con = await BASECONTROL.getCredentialFunc("BETGAMESCREDENTIAL")
    if (con) {
        // let apicode = con.apicode
        let passkey = con.passkey
        console.log("...............check", req.url)
        var data = req.body.root;
        var method = data.method[0];
        var token = data.token[0];
        var time = data.time[0];
        var params = convert_params_tostring(data.params[0]);
        var signature = data.signature[0];
        var string = "method" + method + "token" + token + "time" + time + params + passkey;
        var hashstring = BASECONTROL.md5convert(string);
        var exp_time = get_time() - parseInt(time);
        if (signature == hashstring) {
            if (exp_time < 60) {
                next();
            } else {
                this.response(req, res, next, 0, 2, "request is expired")
            }
        } else {
            this.response(req, res, next, 0, 1, "wrong signature")
        }
    } else {

    }

}

exports.betgames_api = async (req, res, next) => {
    var data = req.body.root;
    var token = data.token[0];
    var method = data.method[0];
    console.log("----------------------process -------1", method);
    console.log("----------------------process -------1", token);
    if (method == "ping") {
        this.ping(req, res, next);
    } else if (method == "transaction_bet_payout") {
        this.transaction_bet_payout(req, res, next);
    } else {
        var userdata = await session_verify(token);
        if (!userdata) {
            this.response(req, res, next, 0, 3, "invalid token");
        } else {
            switch (method) {

                case "get_account_details":
                    this.get_account_details(req, res, next, userdata);
                    break;

                case "refresh_token":
                    this.refresh_token(req, res, next, userdata);
                    break;

                case "request_new_token":
                    this.request_new_token(req, res, next, userdata, token);
                    break;

                case "get_balance":
                    this.get_balance(req, res, next, userdata);
                    break;

                case "transaction_bet_payin":
                    this.transaction_bet_payin(req, res, next, userdata);
                    break;

                case "transaction_bet_subscription_payin":
                    this.transaction_bet_subscription_payin(req, res, next, userdata);
                    break;

                case "transaction_bet_combination_payin":
                    this.transaction_bet_combination_payin(req, res, next, userdata);
                    break;

                case "transaction_bet_combination_payout":
                    this.transaction_bet_combination_payout(req, res, next, userdata);
                    break;

                case "transaction_promo_payout":
                    this.transaction_promo_payout(req, res, next, userdata);
                    break;
            }
        }
    }
}

exports.ping = (req, res, next) => {
    this.response(req, res, next, 1, 0, "");
}

exports.get_account_details = async (req, res, next, player) => {

    var row = {
        user_id: player.id,
        username: player.username,
        currency: "INR",
        info: player.firstname + player.lastname
    }
    this.response(req, res, next, 1, 0, "", row);

}

exports.refresh_token = (req, res, next, userdata) => {
    this.response(req, res, next, 1, 0, "");
}

exports.request_new_token = async (req, res, next, account, token) => {


    var rdata = await BASECONTROL.BfindOne(gamesessionModel, { token: token });
    var intimestamp = parseInt(rdata.intimestamp) / 1000;
    var nowstamp = new Date().valueOf() / 1000;
    console.log(intimestamp, nowstamp)
    console.log(rdata);
    if ((nowstamp - intimestamp) > 1000) {
        var row = {};
        row['intimestamp'] = (new Date()).valueOf();
        row['id'] = account.id;
        row['username'] = account.username;
        row['email'] = account.email;
        row['currency'] = account.currency;
        row['lastname'] = account.lastname;
        row['firstname'] = account.firstname;
        var token = BASECONTROL.md5convert(JSON.stringify(row));
        var uhandle = await BASECONTROL.BfindOneAndUpdate(gamesessionModel, { email: account.email }, { token: token });
        if (uhandle) {
            var data = {
                new_token: token
            }
            this.response(req, res, next, 1, 0, "", data);
        } else {
            this.response(req, res, next, 0, 3, "invalid token");
        }
    } else {
        var data = {
            new_token: token
        }
        this.response(req, res, next, 1, 0, "", data);
    }
}

exports.get_balance = async (req, res, next, account) => {
    var data = {
        balance: (account.balance * 100).toFixed(0)
    }
    this.response(req, res, next, 1, 0, "", data);
}

exports.transaction_bet_payin = async (req, res, next, userdata) => {
    var balance = userdata.balance
    var indata = req.body.root.params[0];
    var amount = parseFloat(indata.amount[0]) / 100;
    var transaction_id = indata.transaction_id[0];
    var bet_id = indata.bet_id[0];
    var userId = userdata.id;
    var gameId = indata.game[0];

    if (balance >= amount) {
        if (amount == 0) {
            this.response(req, res, next, 0, 703, "insufficient balance",);
        } else {
            var lastbet = await is_exist_lastbet(transaction_id, userId, "BET");
            if (!lastbet) {
                var gameId = await BASECONTROL.get_gameid(LAUNCHURL,gameId);
                if (!gameId) {
                    this.response(req, res, next, 0, 3, "invalid token222");
                }


                var betdata = Object.assign({}, { transaction_id: transaction_id }, { prevbalance: balance }, { bet_id: bet_id });
                
                var row = {
                    AMOUNT : amount,
                    LAUNCHURL : LAUNCHURL,
                    TYPE : "BET",
                    userid : mongoose.Types.ObjectId(userId),
                    transactionId : transaction_id,
                    roundId : transaction_id,
                    betting :betdata,
                    gameid : mongoose.Types.ObjectId(gameId.gameid),
                    providerid : mongoose.Types.ObjectId(gameId.providerid),
                };
    
                var wallets_ = {
                    commission:0,
                    gameid : mongoose.Types.ObjectId(gameId.gameid),
                    status :"BET",
                    userid : mongoose.Types.ObjectId(userId),
                    roundid :transaction_id,
                    transactionid : transaction_id,
                    lastbalance : balance,
                    credited : 0,
                    debited : amount
                }

                var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (savehandle) {
                    var updatehandle = await player_balanceupdatein(amount * -1, userId, wallets_);
                    var resdata = {
                        balance_after: updatehandle,
                        already_processed: 0,
                    }
                    this.response(req, res, next, 1, 0, "", resdata);
                } else {
                    this.response(req, res, next, 0, 3, "invalid token222");
                }
            } else {
                var resdata = {
                    already_processed: 1,
                    balance_after: (balance * 100).toFixed(0)
                }
                this.response(req, res, next, 1, 0, "", resdata);
            }
        }
    } else {
        this.response(req, res, next, 0, 703, "insufficient balance",);
    }

}

exports.transaction_bet_payout = async (req, res, next) => {

    console.log("--transaction_bet_payout----------------")
    var indata = req.body.root.params[0];
    var player_id = indata.player_id[0];
    var userdata = await BASECONTROL.playerFindByid(player_id)
    if (!userdata) {
        this.response(req, res, next, 0, 3, "invalid token");
    } else {
        var balance = userdata.balance
        var amount = parseFloat(indata.amount[0]) / 100;
        var transaction_id = indata.transaction_id[0];
        var userId = userdata.userid;
        var bet_id = indata.bet_id[0];
        var gameId = indata.game_id[0];
        var lastbet = await is_exist_lastbet(transaction_id, userId, "WIN");
        if (!lastbet) {
            console.log(bet_id, userId, "BET")
            var lastbet2 = await is_exist_lastbet1(bet_id, userId, "BET");
            if (lastbet2) {

                var lastbet1 = await is_exist_lastbet1(bet_id, userId, "WIN");
                if (!lastbet1) {
                    var gameId = await BASECONTROL.get_gameid(LAUNCHURL,gameId);
                    if (!gameId) {
                        this.response(req, res, next, 0, 3, "invalid token222");
                    }

                    var betdata = Object.assign({}, { transaction_id: transaction_id }, { prevbalance: balance }, { bet_id: bet_id });
                    let {realamount, commamount} = await BASECONTROL.getWinningComission(amount)

                    var row = {
                        AMOUNT : realamount,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "WIN",
                        userid : mongoose.Types.ObjectId(userId),
                        transactionId : transaction_id,
                        roundId : transaction_id,
                        betting :betdata,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                        commission:commamount,
                    };
        
                    var wallets_ = {
                        commission:commamount,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"WIN",
                        userid : mongoose.Types.ObjectId(userId),
                        roundid :transaction_id,
                        transactionid : transaction_id,
                        lastbalance : balance,
                        credited : amount,
                        debited : 0
                    }
                   

                    var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                    if (savehandle) {
                        var updatehandle = await player_balanceupdatein(amount, userId, wallets_);
                        // if (updatehandle){
                        var resdata = {
                            balance_after: updatehandle,
                            already_processed: 0,
                        }
                        this.response(req, res, next, 1, 0, "", resdata);
                        // }else{
                        //     this.response(req,res,next,0,3,"invalid token");
                        // }
                    } else {
                        this.response(req, res, next, 0, 3, "invalid token ffffffffff");
                    }

                } else {
                    var resdata = {
                        already_processed: 1,
                        balance_after: (balance * 100).toFixed(0)
                    }
                    this.response(req, res, next, 1, 0, "", resdata);
                }
            } else {
                this.response(req, res, next, 0, 700, "there is no PAYIN with provided bet_id");
            }
        } else {
            var resdata = {
                already_processed: 1,
                balance_after: (balance * 100).toFixed(0)
            }
            this.response(req, res, next, 1, 0, "", resdata);
        }
    }
}

exports.transaction_bet_subscription_payin = async (req, res, next, userdata) => {
    var indata = req.body.root.params[0];
    var amount = parseFloat(indata.amount[0]) / 100;
    var balance = userdata.balance;
    var gameId = indata.game[0].id[0];
    var userId = userdata.id;
    var subscription_id = indata.subscription_id[0];
    var bets = indata.bet;
    if (balance >= amount) {
        if (amount == 0) {
            this.response(req, res, next, 0, 703, "insufficient balance",);
        } else {
            var lastsubscriptionbet = await is_exist_subscriptionbet(subscription_id, userId, "BET");
            if (!lastsubscriptionbet) {


                var gameId = await BASECONTROL.get_gameid(LAUNCHURL,gameId);
                if (!gameId) {
                    this.response(req, res, next, 0, 3, "invalid token222");
                }
                
                for (var i = 0; i < bets.length; i++) {
                    var newamount = bets[i].amount[0];
                    var newbet_id = bets[i].bet_id[0];
                    var newtransaction_id = bets[i].transaction_id[0];
                    var betdata = Object.assign({}, { transaction_id: newtransaction_id }, { prevbalance: balance }, { bet_id: newbet_id }, { subscription_id: subscription_id });
                    
                    var row = {
                        AMOUNT : newamount,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "BET",
                        userid : mongoose.Types.ObjectId(userId),
                        transactionId : transaction_id,
                        roundId : transaction_id,
                        betting :betdata,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };

                    var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                    if (savehandle) {

                    }

                }
                
    
                var wallets_ = {
                    commission:0,
                    gameid : mongoose.Types.ObjectId(gameId.gameid),
                    status :"BET",
                    userid : mongoose.Types.ObjectId(userId),
                    roundid :transaction_id,
                    transactionid : transaction_id,
                    lastbalance : balance,
                    credited : 0,
                    debited : amount
                }

              
                var updatehandle = await player_balanceupdatein(amount * -1, userId, wallets_);
                // if (updatehandle){
                var resdata = {
                    balance_after: updatehandle,
                    already_processed: 0,
                }
                this.response(req, res, next, 1, 0, "", resdata);
                // }else{
                //     this.response(req,res,next,0,3,"invalid token");
                // }

            } else {
                var resdata = {
                    already_processed: 1,
                    balance_after: (balance * 100).toFixed(0)
                }
                this.response(req, res, next, 1, 0, "", resdata);
            }
        }
    } else {
        this.response(req, res, next, 0, 703, "insufficient balance",);
    }
}

exports.transaction_bet_combination_payin = async (req, res, next, userdata) => {
    var indata = req.body.root.params[0];
    var amount = (parseFloat(indata.amount[0]) / 100);
    var balance = userdata.balance;
    var userId = userdata.id;
    var combination_id = indata.combination_id[0];
    var bets = indata.bet;
    if (balance >= amount) {
        if (amount == 0) {
            this.response(req, res, next, 0, 703, "insufficient balance",);

        } else {
            var lastsubscriptionbet = await is_exist_combinationnbet(combination_id, userId, "BET");
            if (!lastsubscriptionbet) {

                let walletsGameid = ""
                for (var i = 0; i < bets.length; i++) {
                    
                    var newgameId = bets[i].game[0].id[0];

                    var gameId = await BASECONTROL.get_gameid(LAUNCHURL,newgameId);
                    if (!gameId) {
                        this.response(req, res, next, 0, 3, "invalid token222");
                    }
                
                    walletsGameid = mongoose.Types.ObjectId(gameId.gameid)
                    var newamount = amount;
                    var newbet_id = bets[i].bet_id[0];
                    var newtransaction_id = bets[i].transaction_id[0];

                    var betdata = Object.assign({}, { transaction_id: newtransaction_id }, { prevbalance: balance }, { bet_id: newbet_id }, { combination_id: combination_id },);
                   

                    var row = {
                        AMOUNT : newamount,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "BET",
                        userid : mongoose.Types.ObjectId(userId),
                        transactionId : newtransaction_id,
                        roundId : newtransaction_id,
                        betting :betdata,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };


                    var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                    if (savehandle) {
                    }
                }

                // var wallets_ = {
                //     commission: 0,
                //     GAMEID: "GAMEID",
                //     LAUNCHURL: LAUNCHURL,
                //     status: "BET",
                //     USERID: userId,
                //     roundid: combination_id,
                //     transactionid: combination_id,
                //     lastbalance: balance,
                //     credited: 0,
                //     debited: amount
                // }

                var wallets_ = {
                    commission:0,
                    gameid : mongoose.Types.ObjectId(walletsGameid),
                    status :"BET",
                    userid : mongoose.Types.ObjectId(userId),
                    roundid :combination_id,
                    transactionid : combination_id,
                    lastbalance : balance,
                    credited : 0,
                    debited : amount
                }


                var updatehandle = await player_balanceupdatein(amount * -1, userId, wallets_);
                // if (updatehandle){
                var resdata = {
                    balance_after: updatehandle,
                    already_processed: 0,
                }
                this.response(req, res, next, 1, 0, "", resdata);
                // }else{
                //     this.response(req,res,next,0,3,"invalid token");
                // }

            } else {
                var resdata = {
                    already_processed: 1,
                    balance_after: (balance * 100).toFixed(0)
                }
                this.response(req, res, next, 1, 0, "", resdata);
            }
        }
    } else {
        this.response(req, res, next, 0, 703, "insufficient balance",);
    }

}

exports.transaction_bet_combination_payout = async (req, res, next, userdata) => {
    var indata = req.body.root.params[0];
    var amount = (parseFloat(indata.amount[0]) / 100);
    var balance = userdata.balance;
    var userId = userdata.id;
    var combination_id = indata.combination_id[0];
    var bets = indata.bet;
    var lastsubscriptionwin = await is_exist_combinationnbet(combination_id, userId, "WIN");
    if (!lastsubscriptionwin) {
        var lastsubscriptionbet = await is_exist_combinationnbet(combination_id, userId, "BET");
        if (!lastsubscriptionbet) {
            this.response(req, res, next, 0, 700, "there is no PAYIN with provided bet_id");
        } else {

            let walletsGameid = ""

            let updatehandle = 0
            for (var i = 0; i < bets.length; i++) {

                var newamount = amount;
                var newbet_id = bets[i].bet_id[0];
                var newtransaction_id = bets[i].transaction_id[0];
                var newgameId = bets[i].game_id[0];
                var gameId = await BASECONTROL.get_gameid(LAUNCHURL,newgameId);
                if (!gameId) {
                    this.response(req, res, next, 0, 3, "invalid token222");
                }
            
                walletsGameid = mongoose.Types.ObjectId(gameId.gameid)
                let plbalance = 0
                let outdata = await BASECONTROL.PlayerFindByemail(userdata.email);
                if (outdata) {
                    plbalance = parseFloat(outdata.balance.toFixed(2));
                }

                var betdata = Object.assign({}, { transaction_id: newtransaction_id }, { prevbalance: plbalance }, { bet_id: newbet_id }, { combination_id: combination_id },);
                // var row = {
                //     GAMEID: newgameId,
                //     LAUNCHURL: LAUNCHURL,
                //     AMOUNT: newamount,
                //     TYPE: "WIN",
                //     USERID: userId,
                //     betting: betdata
                // };
                let {realamount, commamount} = await BASECONTROL.getWinningComission(newamount)
                var row = {
                    AMOUNT : realamount,
                    LAUNCHURL : LAUNCHURL,
                    TYPE : "WIN",
                    userid : mongoose.Types.ObjectId(userId),
                    transactionId : newtransaction_id,
                    roundId : newtransaction_id,
                    betting :betdata,
                    gameid : mongoose.Types.ObjectId(gameId.gameid),
                    providerid : mongoose.Types.ObjectId(gameId.providerid),
                     commission:commamount,
                };

                var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (savehandle) {
                }

                var wallets_ = {
                    commission:commamount,
                    gameid : mongoose.Types.ObjectId(walletsGameid),
                    status :"WIN",
                    userid : mongoose.Types.ObjectId(userId),
                    roundid :combination_id,
                    transactionid : combination_id,
                    lastbalance : plbalance,
                    credited : realamount,
                    debited : 0
                }
    
                updatehandle = await player_balanceupdatein(realamount * 1, userId, wallets_);
            }
            // var wallets_ = {
            //     commission: 0,
            //     GAMEID: "GAMEID",
            //     LAUNCHURL: LAUNCHURL,
            //     status: "WIN",
            //     USERID: userId,
            //     roundid: combination_id,
            //     transactionid: combination_id,
            //     lastbalance: balance,
            //     credited: amount,
            //     debited: 0
            // }
           
            // if (updatehandle){
            var resdata = {
                balance_after: updatehandle,
                already_processed: 0,
            }
            this.response(req, res, next, 1, 0, "", resdata);
            // }else{
            // this.response(req,res,next,0,3,"invalid token");
            // }
        }
    } else {
        var resdata = {
            already_processed: 1,
            balance_after: (balance * 100).toFixed(0)
        }
        this.response(req, res, next, 1, 0, "", resdata);
    }

}

exports.transaction_promo_payout = async (req, res, next, userdata) => {
    var balance = userdata.balance;
    var indata = req.body.root.params[0];
    var amount = (parseFloat(indata.amount[0]) / 100);
    var promo_transaction_id = indata.promo_transaction_id[0];
    if (indata.bet_id) {
        var bet_id = indata.bet_id[0];
        var userId = userdata.id;
        var lastpromo_transactionwin = await is_exist_promo_transactionwin(promo_transaction_id, userId, "WIN");
        if (!lastpromo_transactionwin) {
            var lastbet2 = await is_exist_lastbet1(bet_id, userId, "BET");
            if (lastbet2) {
                var betdata = Object.assign({}, { promo_transaction_id: promo_transaction_id }, { prevbalance: balance }, { bet_id: bet_id });
                // var row = {
                //     GAMEID: "bonus",
                //     LAUNCHURL: LAUNCHURL,
                //     AMOUNT: amount,
                //     TYPE: "WIN",
                //     USERID: userId,
                //     betting: betdata
                // };
                // var wallets_ = {
                //     commission: 0,
                //     GAMEID: "bonus",
                //     LAUNCHURL: LAUNCHURL,
                //     status: "WIN",
                //     USERID: userId,
                //     roundid: bet_id,
                //     transactionid: promo_transaction_id,
                //     lastbalance: balance,
                //     credited: amount,
                //     debited: 0
                // }
                let {realamount, commamount} = await BASECONTROL.getWinningComission(amount)


                var row = {
                    AMOUNT : realamount,
                    LAUNCHURL : LAUNCHURL,
                    TYPE : "WIN",
                    userid : mongoose.Types.ObjectId(userId),
                    transactionId : promo_transaction_id,
                    roundId : promo_transaction_id,
                    betting :betdata,
                    gameid : mongoose.Types.ObjectId("60c0bc372c5c2a75ea137837"),
                    providerid : mongoose.Types.ObjectId("5fab84107eeb074b6ece21c0"),
                    commission:commamount,
                };
    
                var wallets_ = {
                    commission:commamount,
                    gameid : mongoose.Types.ObjectId("60c0bc372c5c2a75ea137837"),
                    status :"WIN",
                    userid : mongoose.Types.ObjectId(userId),
                    roundid :promo_transaction_id,
                    transactionid : promo_transaction_id,
                    lastbalance : balance,
                    credited : realamount,
                    debited : 0
                }

                var savehandle = await BASECONTROL.data_save(row, BonusBettingHistory_model);
                if (savehandle) {
                    var updatehandle = await player_balanceupdatein(realamount, userId, wallets_);
                    // if (updatehandle){
                    var resdata = {
                        balance_after: updatehandle,
                        already_processed: 0,
                    }
                    this.response(req, res, next, 1, 0, "", resdata);
                    // }else{
                    // this.response(req,res,next,0,3,"invalid token");
                    // }
                } else {
                    this.response(req, res, next, 0, 3, "invalid token");
                }
            } else {
                this.response(req, res, next, 0, 700, "there is no PAYIN with provided bet_id");
            }
        } else {
            var resdata = {
                already_processed: 1,
                balance_after: (balance * 100).toFixed(0)
            }
            this.response(req, res, next, 1, 0, "", resdata);
        }
    } else {
        this.response(req, res, next, 0, 3, "invalid token");
    }
}