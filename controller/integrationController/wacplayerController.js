
const o2x = require('object-to-xml');
const BASECONTROL = require("./../basecontroller");
const gamesessionModel = require("../../models/users_model").gamesessionmodel;
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
const LAUNCHURL = "5"
const mongoose = require('mongoose');

module.exports = class VIVOController {
    constructor() {
    }

    api = async (req) => {
            var indata = req.body.message.method[0];
            var flag = indata.$.name;
            var credentials = indata.credentials[0].$;
            var login = credentials.login;
            var password = credentials.password;
            var params = indata.params[0];
            
        
            switch (flag) {
                case "getPlayerInfo": {
                    var token = params.token[0].$.value;
                    var returndata = await getPlayerInfo(token);
                   
                    return (returndata)
                    break;
                }
                case "getBalance": {
                    var token = params.token[0].$.value;
                    var returndata = await getBalance(token);
                    return (returndata)

                    break;
                }
                case "bet": {
        
                    var indata = {
                        token: params.token[0].$.value,
                        transactionid: params.transactionid[0].$.value,
                        amount: params.amount[0].$.value,
                        gamereference: params.gamereference[0].$.value,
                        roundid: params.roundid[0].$.value,
                        type: "BET"
                    }
                    var returndata = await bet(indata);
                    return (returndata)

                    break;
                }
                case "win": {
        
                    var indata = {
                        token: params.token[0].$.value,
                        transactionid: params.transactionid[0].$.value,
                        amount: params.amount[0].$.value,
                        gamereference: params.gamereference[0].$.value,
                        roundid: params.roundid[0].$.value,
                        type: "WIN"
                    }
                    var returndata = await win(indata);
        
                    return (returndata)

                    break;
                }
                case "refundTransaction": {
        
        
                    var indata = {
                        token: params.token[0].$.value,
                        transactionid: params.transactionid[0].$.value,
                        amount: params.amount[0].$.value,
                        gamereference: params.gamereference[0].$.value,
                        roundid: params.roundid[0].$.value,
                        refundedTransactionid: params.refundedtransactionid[0].$.value,
                        type: "CANCELED_BET"
                    }
                    var returndata = await refundTransaction(indata);
                    return (returndata)

                    break;
                }
        
            }
        
    
    }
}

async function player_balanceupdatein(amount, username, wallets) {
    var outdata = await BASECONTROL.player_balanceupdatein_Username(amount, username, wallets);
    if (!outdata) {
        return outdata;
    } else {
        return (outdata * 100).toFixed(0);
    }
}

async function GetCurrency() {
    let cur = await BASECONTROL.getCurrency();
    return cur
}

//---------------------------getplayerinfor ------------------------------------

async function get_success(indata) {
    let currency = await GetCurrency();
    var objsuccess = {
        '?xml version=\"1.0\" encoding=\"iso-8859-1\"?': null,
        message: {
            result: {
                '@': {
                    name: 'getPlayerInfo',
                    success: "1"
                },
                '#': {
                    returnset: {
                        token: {
                            '@': {
                                value: indata.token,
                            }
                        },
                        loginName: {
                            '@': {
                                value: indata.username,
                            }
                        },
                        currency: {
                            '@': {
                                value: currency
                            }
                        },
                        balance: {
                            '@': {
                                value: indata.balance
                            }
                        }
                    }
                }
            }
        }
    };
    return o2x(objsuccess)
}

async function getPlayerInfo(indata) {

    var user = await get_token_user(indata);
    if (!user) {
        return get_error({ error: "The player token is invalid", errorCode: "101", name: "getPlayerInfo" })
    } else {
        let dd = await get_success({ username: user.username, token: indata, balance: user.balance });
        return dd
    }
}

//---------------------------getBalance ------------------------------------

function get_success_bal(indata) {
    var objsuccess = {
        '?xml version=\"1.0\" encoding=\"iso-8859-1\"?': null,
        message: {
            result: {
                '@': {
                    name: 'getBalance',
                    success: "1"
                },
                '#': {
                    returnset: {
                        token: {
                            '@': {
                                value: indata.token,
                            }
                        },

                        balance: {
                            '@': {
                                value: (indata.balance).toFixed(0) + ""
                            }
                        }
                    }
                }
            }
        }
    };
    return o2x(objsuccess)
}

async function getBalance(indata) {
    var user = await get_token_user(indata);
    if (!user) {
        return get_error({ error: "The player token is invalid", errorCode: "101", name: "getbalance" })
    } else {
        return get_success_bal({ username: user.username, token: indata, balance: user.balance });
    }
}

//---------------------------bet ------------------------------------

function get_success_bet(indata) {
    var objsuccess = {
        '?xml version=\"1.0\" encoding=\"iso-8859-1\"?': null,
        message: {
            result: {
                '@': {
                    name: 'bet',
                    success: "1"
                },
                '#': {
                    returnset: {
                        token: {
                            '@': {
                                value: indata.token,
                            }
                        },
                        balance: {
                            '@': {
                                value: (indata.balance).toFixed(0) + ""
                            }
                        },
                        transactionId: {
                            '@': {
                                value: indata.transactionid
                            }
                        },
                        alreadyProcessed: {
                            '@': {
                                value: indata.alreadyProcessed
                            }
                        }
                    }
                }
            }
        }
    };
    return o2x(objsuccess)
}

async function bet(indata) {
    var amount = parseFloat(indata.amount) / 100;
    var newrow = {};
    var user = await get_token_user(indata.token);
    if (!user) {
        return get_error({ error: "The player token is invalid", errorCode: "101", name: "bet" })
    } else {//{transactionid : indata.transactionid,type : "BET"}
        var lastbet = await BASECONTROL.BfindOne(betting_historymodel, { $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: indata.type }, { "betting.transactionid": indata.transactionid }] });
        if (!lastbet) {
            if (user.balance < parseInt(indata.amount)) {
                return get_error({ error: "Invalid PKT. Method element expected", errorCode: "-1", name: "bet" });
            } else {
                // indata['prevbalance'] = user.balance/100;
                // indata['userId'] = user.id;

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL, indata.gamereference);
                if (!gameId) {
                    return get_error({ error: "Invalid PKT. Method element expected", errorCode: "-1", name: "bet" });
                }
                var row = {
                    AMOUNT: amount,
                    LAUNCHURL: LAUNCHURL,
                    TYPE: indata.type,
                    transactionId: indata.transactionid,
                    roundId: indata.roundid,
                    userid: mongoose.Types.ObjectId(user.id),
                    betting: {
                        transactionid: indata.transactionid,
                        prevbalance: user.balance / 100,
                        roundid: indata.roundid

                    },
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                    ipaddress:user.ip
                };

                var wallets_ = {
                    commission: 0,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    status: indata.type,
                    userid: mongoose.Types.ObjectId(user.id),
                    roundid: indata.roundid,
                    transactionid: indata.transactionid,
                    lastbalance: user.balance / 100,
                    credited: 0,
                    debited: amount,
                    ipaddress:user.ip
                }


                var saveHandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (!saveHandle) {
                    return get_error({ error: "Invalid PKT. Method element expected", errorCode: "-1", name: "bet" });
                } else {


                    var updatehandle = await player_balanceupdatein(amount * -1, user.username, wallets_);
                    if (updatehandle === false) {
                        return get_error({ error: "Invalid PKT. Method element expected", errorCode: "-1", name: "bet" });
                    } else {
                        newrow = {
                            transactionid: indata.transactionid,
                            alreadyProcessed: false,
                            balance: updatehandle,
                            token: indata.token
                        }
                        return get_success_bet(newrow)
                    }
                }
            }
        } else {
            newrow = {
                transactionid: indata.transactionid,
                alreadyProcessed: true,
                balance: user.balance,
                token: indata.token
            }
            return get_success_bet(newrow)
        }
    }
}

//----------------------------------win----------------

function get_success_bet(indata) {
    var objsuccess = {
        '?xml version=\"1.0\" encoding=\"iso-8859-1\"?': null,
        message: {
            result: {
                '@': {
                    name: 'bet',
                    success: "1"
                },
                '#': {
                    returnset: {
                        token: {
                            '@': {
                                value: indata.token,
                            }
                        },
                        balance: {
                            '@': {
                                value: (indata.balance) + ""
                            }
                        },
                        transactionId: {
                            '@': {
                                value: indata.transactionid
                            }
                        },
                        alreadyProcessed: {
                            '@': {
                                value: indata.alreadyProcessed
                            }
                        }
                    }
                }
            }
        }
    };
    return o2x(objsuccess)
}

async function win(indata) {
    var amount = parseFloat(indata.amount) / 100;

    var newrow = {};
    var user = await get_token_user(indata.token, true);
    if (!user) {
        return get_error({ error: "The player token is invalid", errorCode: "101", name: "win" })
    } else {//,{transactionid : indata.transactionid,type : "WIN"}
        var lastwin = await BASECONTROL.BfindOne(betting_historymodel, { $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: indata.type }, { "betting.transactionid": indata.transactionid }] });
        if (!lastwin) {//{roundid : indata.roundid,type : "BET"}
            var lastbet = await BASECONTROL.BfindOne(betting_historymodel, { $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: "BET" }, { "betting.roundid": indata.roundid }] });
            if (!lastbet) {
                return get_error({ error: "Invalid PKT. Method element expected", errorCode: "9999", name: "win" });
            } else {
                indata['userId'] = user.id;
                indata['prevbalance'] = user.balance / 100;


                var gameId = await BASECONTROL.get_gameid(LAUNCHURL, indata.gamereference);

                var {realamount, commamount} = await BASECONTROL.getWinningComission(amount)

                var row = {
                    AMOUNT: realamount,
                    LAUNCHURL: LAUNCHURL,
                    TYPE: indata.type,
                    transactionId: indata.transactionid,
                    roundId: indata.roundid,
                    userid: mongoose.Types.ObjectId(user.id),
                    betting: {
                        transactionid: indata.transactionid,
                        prevbalance: user.balance / 100,
                        roundid: indata.roundid
                    },
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                    ipaddress: user.ipaddress,
                    commission: commamount,
                };

                var wallets_ = {
                    commission: commamount,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    status: indata.type,
                    userid: mongoose.Types.ObjectId(user.id),
                    roundid: indata.roundid,
                    transactionid: indata.transactionid,
                    lastbalance: user.balance / 100,
                    credited: realamount,
                    debited: 0,
                    ipaddress: user.ipaddress
                }

                var saveHandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (!saveHandle) {
                    return get_error({ error: "Invalid PKT. Method element expected", errorCode: "-1", name: "win" });
                } else {
                    // var amount = parseFloat(indata.amount);
                    var updatehandle = await player_balanceupdatein(realamount, user.username, wallets_);
                    if (updatehandle === false) {
                        return get_error({ error: "Invalid PKT. Method element expected", errorCode: "-1", name: "win" });
                    } else {
                        newrow = {
                            transactionid: indata.transactionid,
                            alreadyProcessed: false,
                            balance: updatehandle,
                            token: indata.token
                        }
                        return get_success_bet(newrow)
                    }
                }
            }
        } else {
            newrow = {
                transactionid: indata.transactionid,
                alreadyProcessed: true,
                balance: user.balance,
                token: indata.token
            }
            return get_success_bet(newrow)
        }
    }
}

//---------------------------------refund bet---------------------

async function refundTransaction(indata) {
    var amount = parseFloat(indata.amount) / 100;

    var newrow = {};
    var user = await get_token_user(indata.token, true);
    if (!user) {
        return get_error({ error: "The player token is invalid", errorCode: "101", name: "refundTransaction" })
    } else {//{transactionid : indata.transactionid,type : "CANCELED_BET"}
        var lastwin = await BASECONTROL.BfindOne(betting_historymodel, { $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: indata.type }, { "betting.transactionid": indata.transactionid }] });
        if (!lastwin) {//{transactionid : indata.refundedTransactionid,type : "BET"}
            var lastbet = await BASECONTROL.BfindOne(betting_historymodel, { $and: [{ LAUNCHURL: LAUNCHURL }, { TYPE: "BET" }, { "betting.transactionid": indata.refundedTransactionid }] });
            if (!lastbet) {
                return get_error({ error: "Invalid PKT. Method element expected", errorCode: "5000", transactionid: indata.refundedTransactionid, name: "refundTransaction" });
            } else {
                indata['userId'] = user.id;
                indata['prevbalance'] = user.balance / 100;

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL, indata.gamereference);
                if (!gameId) {
                    return get_error({ error: "Invalid PKT. Method element expected", errorCode: "-1", name: "bet" });
                }
                var row = {
                    AMOUNT: amount,
                    LAUNCHURL: LAUNCHURL,
                    transactionId: indata.transactionid,
                    roundId: indata.roundid,
                    TYPE: indata.type,
                    userid: mongoose.Types.ObjectId(user.id),
                    betting: {
                        transactionid: indata.refundedTransactionid,
                        prevbalance: user.balance / 100,
                        roundid: indata.roundid
                    },
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                    ipaddress: user.ipaddress
                };

                var wallets_ = {
                    commission: 0,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    status: indata.type,
                    userid: mongoose.Types.ObjectId(user.id),
                    roundid: indata.roundid,
                    transactionid: indata.refundedTransactionid,
                    lastbalance: user.balance / 100,
                    credited: amount,
                    debited: 0,
                    ipaddress: user.ipaddress
                }

                var saveHandle = await BASECONTROL.data_save(row, betting_historymodel);
                if (!saveHandle) {
                    return get_error({ error: "Invalid PKT. Method element expected", errorCode: "-1", name: "refundTransaction" });
                } else {
                    var updatehandle = await player_balanceupdatein(amount, user.username, wallets_);
                    if (updatehandle === false) {
                        return get_error({ error: "Invalid PKT. Method element expected", errorCode: "-1", name: "refundTransaction" });
                    } else {
                        newrow = {
                            transactionid: indata.transactionid,
                            alreadyProcessed: false,
                            balance: updatehandle,
                            token: indata.token
                        }
                        return get_success_bet(newrow)
                    }
                }
            }
        } else {
            newrow = {
                transactionid: indata.transactionid,
                alreadyProcessed: true,
                balance: user.balance,
                token: indata.token
            }
            return get_success_bet(newrow)
        }
    }
}

//------------------------------------etc-------------------

async function get_token_user(indata, userid) {
    let token = indata.split(":")[0]
    if (!userid) {
        var ses = await BASECONTROL.BfindOne(gamesessionModel, { token });
        if (!ses) {
            return false
        } else {
            var user = await BASECONTROL.PlayerFindByemail(ses.email);
    
            if (!user) {
                return false;
            } else {
                user.balance = parseInt((user.balance * 100).toFixed(0));
                user['ip'] = ses.ipaddress
                return user;
            }
        }

    } else {
        token = indata.split(":")[1]
        var user = await BASECONTROL.playerFindByid(token);
        if (!user) {
            return false;
        } else {
            user.balance = parseInt((user.balance * 100).toFixed(0));
            return user;
        }
    }
}

function get_error(indata) {
    var objerror = {
        '?xml version=\"1.0\" encoding=\"iso-8859-1\"?': null,
        message: {
            result: {
                '@': {
                    name: indata.name,
                    success: 0
                },
                '#': {
                    returnset: {
                        error: {
                            '@': {
                                value: indata.errorCode == "5000" ? "Transaction with id=" + indata.transactionid + " doesn’t exists." : indata.error,
                            }
                        },
                        errorCode: {
                            '@': {
                                value: indata.errorCode,
                            }
                        }
                    }
                }
            }
        }
    };
    return o2x(objerror)
}
