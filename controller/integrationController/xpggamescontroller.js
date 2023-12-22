
const BASECONTROL = require("./../basecontroller");
const betting_historymodel = require("../../models/bettinghistory_model").BettingHistory_model;
const PVMANAGEconfig = require("../../config/providermanage.json");
const  LAUNCHURL = PVMANAGEconfig.launchurl_key.XPG;
const mongoose = require("mongoose")

async function player_balanceupdatein (uid,amount,wallets){
    var outdata = await BASECONTROL.player_balanceupdatein_Id(amount,uid,wallets);
    return outdata;
}

module.exports = class XpgController {
    constructor() {
    }

    getReturnString = async (data,ErrorCode,HasErrors,Message,key = true) => {
        if(key) {
            let returnData = {
                "d": {
                    "Data": [parseFloat(data).toFixed(2)],
                    "ErrorCode": ErrorCode,
                    "HasErrors": HasErrors,
                    "Message": Message
                }
            }
            return returnData;
        } else {
            let returnData = {
                "d": {
                    "ErrorCode": ErrorCode,
                    "HasErrors": HasErrors,
                    "Message": Message
                }
            }
            return returnData;
        }
    }
    
    PlayerGetBalance = async(req, res) => {
        let inputdata = req.body;
        let returnData = null;
        if (!inputdata['Login'] || !inputdata['OperatorId']) {
            returnData = await this.getReturnString(0, -2, true, "Obligation field missing")
            return res.json(returnData);
        }

        BASECONTROL.sesssion_update_username(inputdata['Login']);

        returnData = await this.PlayerGetBalanceChild(inputdata['Login']);
        return res.json(returnData);
    }
    
    PlayerGetBalanceChild = async(username) => {
        let outdata = null;
        let rdata = await BASECONTROL.playerFindByusername( username);
        if (!rdata) {
            outdata = await this.getReturnString(0, -10, true, "Player not found in Partner system");
        } else {
            outdata = await this.getReturnString(rdata.balance, 0, false, "Success call");
        }
        return outdata;
    }
    
    Debit = async(req, res) => {
        let inputdata = req.body;
        let returnData = null;
        if (inputdata.DebitDetails === undefined || !inputdata['Login'] || !inputdata['OperatorId'] || !inputdata['GameId'] || !inputdata['RoundId'] || !inputdata['Amount'] || !inputdata['Sequence']) {
            returnData = await this.getReturnString(0, -2, true, "Obligation field missing")
            return res.json(returnData);
        }
        let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            RoundId: inputdata.RoundId,
            amount: inputdata.Amount == null ? 0 : parseFloat(inputdata.Amount),
            Sequence: inputdata.Sequence,
            DebitDetails: inputdata.DebitDetails,
        }
        returnData = await this.DebitChild(p_inputdata);
        // setTimeout(() => {
            return res.json(returnData);
        // }, 3000);
    }
    
    debitVerify = async (indata) => {
        let outdata = await BASECONTROL.BfindOne(betting_historymodel, { 
            LAUNCHURL, 
            TYPE: "BET",
            "betting.Login": indata.Login, 
            "betting.RoundId": indata.RoundId, 
            "betting.GameId": indata.GameId, 
            "betting.Sequence": indata.Sequence
        })
        return outdata;
    }
    
    DebitChild = async (indata) => {
        let outdata = null;
        let { Login, amount } = indata;
        console.log("---1---")
        let player = await BASECONTROL.playerFindByusername( Login);
        if (!player) {
            outdata = await this.getReturnString(0, -10, true, "Player not found in Partner system");
            return outdata;
        } else {
        console.log("---2---")
            let debitVerifyStatus = await this.debitVerify(indata);
            if (debitVerifyStatus) {
                if (debitVerifyStatus.AMOUNT == amount) {
                    outdata = await this.getReturnString(player.balance, 21, true, "Transaction has already been recorded in Partner server")
                    return outdata;
                } else {
                    outdata = await this.getReturnString(0, -22, true, "Transaction for specified RoundID and Username already recorded for different amount")
                    return outdata;
                }
            } else {
                if (player.balance >= amount) {
        console.log("---3---")
                    var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.GameId);
                    if (!gameId) {
                        outdata = await this.getReturnString(0, -1, true, "Unknown error");
                        return outdata;
                    }
                    console.log("---4---")
                    var row = {
                        AMOUNT : amount,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        betting : {
                            Login : indata.Login,
                            RoundId : indata.RoundId,
                            GameId : indata.GameId,
                            Sequence : indata.Sequence
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };
            
                    var wallets_ = {
                        commission:0,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        roundid :indata.RoundId,
                        transactionid : indata.RoundId,
                        lastbalance : player.balance,
                        credited : 0,
                        debited : amount
                    }

                    let afterBalance = await player_balanceupdatein(player.id, -1 * amount, wallets_);
                    if (afterBalance === false) {
                    console.log("---7---")
                        outdata = await this.getReturnString(0, -1, true, "Unknown error");
                        return outdata;
                    } else {
                    console.log("---6---")
                        BASECONTROL.data_save(row, betting_historymodel);
                        outdata = await this.getReturnString(afterBalance, 0, false, "Success call");
                        return outdata;
                    }
                } else {
                    outdata = await this.getReturnString(0, -20, true, "InsufficientFunds Player balance is insufficient to place bet");
                    return outdata;
                }
            }
        }
    }
    
    Credit = async(req, res) => {
        let inputdata = req.body;
        let returnData = null;
        if (inputdata.CreditDetails === undefined || !inputdata['Login'] || !inputdata['OperatorId'] || !inputdata['GameId'] || !inputdata['RoundId']) {
            returnData = await this.getReturnString(0, -2, true, "Obligation field missing")
            return res.json(returnData);
        }
        let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            RoundId: inputdata.RoundId,
            amount: inputdata.Amount === null ? 0 : parseFloat(inputdata.Amount),
            CreditDetails: inputdata.CreditDetails,
        }
        returnData = await this.creditChild(p_inputdata)
        return res.json(returnData);
    }
    
    creditVerify = async (indata) => {
        let data = await BASECONTROL.BfindOne(betting_historymodel, {
            LAUNCHURL,
            TYPE: "WIN",
            "betting.Login": indata.Login,
            "betting.RoundId": indata.RoundId,
            "betting.GameId": indata.GameId
        })
        return data;
    }
    
    creditBetVerify = async (indata) => {
        let data = await BASECONTROL.BfindOne(betting_historymodel, {
            LAUNCHURL,
            TYPE: "BET",
            "betting.Login": indata.Login,
            "betting.RoundId": indata.RoundId,
            "betting.GameId": indata.GameId
        })
        return data;
    }
    
    creditChild = async (indata) => {
        let { amount, Login } = indata;
        let outdata = null;
        let player = await BASECONTROL.playerFindByusername( Login);
        if (player) {
            let lastwin = await this.creditVerify(indata);
            if (!lastwin) {

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.GameId);
                if (!gameId) {
                    outdata = await this.getReturnString(0, -1, true, "Unknown error")
                    return outdata;
                }
                    
                var row = {
                    AMOUNT : amount,
                    LAUNCHURL : LAUNCHURL,
                    TYPE : "WIN",
                    userid : mongoose.Types.ObjectId(player.id),
                    betting : {
                        Login : indata.Login,
                        RoundId : indata.RoundId,
                        GameId : indata.GameId,
                        Sequence : indata.Sequence
                    },
                    gameid : mongoose.Types.ObjectId(gameId.gameid),
                    providerid : mongoose.Types.ObjectId(gameId.providerid),
                };

                let lastbet = await this.creditBetVerify(indata);
                if (!lastbet) {
                   
                    await BASECONTROL.data_save(row, betting_historymodel);
                    outdata = await this.getReturnString(player.balance, -30, true, "No game record exists for this game");
                    return outdata;
                } else {
                    
                    var wallets_ = {
                        commission:0,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"WIN",
                        userid : mongoose.Types.ObjectId(player.id),
                        roundid :indata.RoundId,
                        transactionid : indata.RoundId,
                        lastbalance : player.balance,
                        credited : amount,
                        debited : 0
                    }

                    let afterBalance = await player_balanceupdatein(player.id, amount, wallets_);
                    if (afterBalance === false) {
                        outdata = await this.getReturnString(0, -1, true, "Unknown error")
                        return outdata;
                    } else {
                        BASECONTROL.data_save(row, betting_historymodel);
                        outdata = await this.getReturnString(afterBalance, 0, false, "Success call")
                        return outdata;
                    }
                }
            } else {
                if (lastwin.AMOUNT == amount || lastwin.AMOUNT == 0) {
                    outdata = await this.getReturnString(player.balance, 21, true, "Transaction has already been recorded in Partner server")
                    return outdata;
                } else {
                    outdata = await this.getReturnString(0, -22, true, "Transaction for specified RoundID and Username already recorded for different amount")
                    return outdata;
                }
            }
        } else {
            outdata = await this.getReturnString(0, -10, true, "Player not found in Partner system");
            return outdata;
        }
    }
    
    CancelTransaction = async(req, res) => {
        let inputdata = req.body;
        let returnData = null
        if (!inputdata['Login'] || !inputdata['OperatorId'] || !inputdata['GameId'] || !inputdata['RoundId'] || !inputdata['Sequence']) {
            returnData = await this.getReturnString(0, -2, true, "Obligation field missing")
            return res.json(returnData);
        }
        let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            RoundId: inputdata.RoundId,
            Sequence: inputdata.Sequence,
        }
        let rdata = await this.cancelChild(p_inputdata)
        return res.json(rdata);
    }
    
    cancelVerify = async (inputdata) => {
        let data = await BASECONTROL.BfindOne(betting_historymodel, {
            LAUNCHURL,
            TYPE: "CANCELED_BET",
            "betting.Login": inputdata.Login,
            "betting.RoundId": inputdata.RoundId,
            "betting.GameId": inputdata.GameId,
            "betting.Sequence": inputdata.Sequence,
        })
        return data;
    }
    
    cancelChild = async (indata) => {
        let outdata = null;
        let player = await BASECONTROL.playerFindByusername( indata.Login);
        if (player) {
            let lastCancel = await this.cancelVerify(indata);
            if (lastCancel) {
                outdata = await this.getReturnString(player.balance, 21, true, "Transaction has already been recorded in Partner server")
                return outdata;
            } else {

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.GameId);
                if (!gameId) {
                    outdata = await this.getReturnString(0, -1, true, "Unknown error")
                    return outdata;
                }
                    
                
                
                let debitVerifyStatus = await this.debitVerify(indata);
                if (!debitVerifyStatus) {
                    var row = {
                        AMOUNT : 0,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "CANCELED_BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        betting : {
                            Login : indata.Login,
                            RoundId : indata.RoundId,
                            GameId : indata.GameId,
                            Sequence : indata.Sequence
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };
                    await BASECONTROL.data_save(row, betting_historymodel);
                    outdata = await this.getReturnString(player.balance, -30, true, "No game record exists for this game")
                    return outdata;
                } else if(debitVerifyStatus.AMOUNT === 0) {
                    outdata = await this.getReturnString(player.balance, 21, true, "Transaction has already been recorded in Partner server")
                    return outdata;
                } else {
                    var row = {
                        AMOUNT : debitVerifyStatus.AMOUNT,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "CANCELED_BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        betting : {
                            Login : indata.Login,
                            RoundId : indata.RoundId,
                            GameId : indata.GameId,
                            Sequence : indata.Sequence
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };

                    var wallets_ = {
                        commission:0,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"CANCELED_BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        roundid :indata.RoundId,
                        transactionid : indata.RoundId,
                        lastbalance : player.balance,
                        credited : debitVerifyStatus.AMOUNT,
                        debited : 0
                    }

                    let afterBalance = await player_balanceupdatein(player.id, debitVerifyStatus.AMOUNT, wallets_);
                    if (afterBalance === false) {
                        outdata = await this.getReturnString(0, -1, true, "Unknown error")
                        return outdata;
                    } else {
                       
                        BASECONTROL.data_save(row, betting_historymodel);
                        outdata = await this.getReturnString(afterBalance, 0, false, "Success call")
                        return outdata;
                    }
                }
            }
        } else {
            outdata = await this.getReturnString(0, -10, true, "Player not found in Partner system");
            return outdata;
        }
    }
    
    CancelRound = async(req, res) => {
        let inputdata = req.body;
        let returnData = null;
        // if (!inputdata['Logins'] || !inputdata['OperatorId'] || !inputdata['GameId'] || !inputdata['RoundId']) {
        //     returnData = await this.getReturnString(0, -2, true, "Obligation field missing", false)
        //     return res.json(returnData);
        // }
        let p_inputdata = {
            Logins: inputdata.Logins,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            RoundId: inputdata.RoundId,
        }
        let rdata = await this.cancelRoundChild(p_inputdata)
        return res.json(rdata);
    }
    
    cancelRoundVerify = async (indata) => {
        let data = await BASECONTROL.BfindOne(betting_historymodel, {
            LAUNCHURL,
            TYPE: "CANCELED_BET",
            "betting.RoundId": indata.RoundId,
            "betting.GameId": indata.GameId,
        })
        return data;
    }
    
    Round_debit = async (indata, userid) => {
        let data = await BASECONTROL.bFind(betting_historymodel, {
            LAUNCHURL,
            TYPE: "BET",
            "betting.Login": userid, 
            "betting.RoundId": indata.RoundId,
            "betting.GameId": indata.GameId,
            $nor: [{"betting.Sequence": 1001}]
        })
        return data;
    }
    
    cancelRoundChild = async (indata) => {
        let users = indata.Logins;
        let lastround = await this.cancelRoundVerify(indata);
        let outdata = null;
        if (!lastround) {

            var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.GameId);
            if (!gameId) {
                outdata = await this.getReturnString(0, -1, true, "Unknown error")
                return outdata;
            }
            for (let i = 0; i < users.length; i++) {

                let player = await BASECONTROL.playerFindByusername( users[i]);
                if (player) {
                    let lastbets = await this.Round_debit(indata, users[i]);


                    if (lastbets && lastbets.length > 0) {
                        let amount = 0;

                        for (let j = 0; j < lastbets.length; j++) {
                            amount += lastbets[j].AMOUNT;
                        }
                        
                        var wallets_ = {
                            commission:0,
                            gameid : mongoose.Types.ObjectId(gameId.gameid),
                            status :"CANCELED_BET",
                            userid : mongoose.Types.ObjectId(player.id),
                            roundid :indata.RoundId,
                            transactionid : indata.RoundId,
                            lastbalance : player.balance,
                            credited : amount,
                            debited : 0
                        }
                        let afterBalance = await player_balanceupdatein(player.id, amount, wallets_);
                        if (afterBalance !== false) {
                            var row = {
                                AMOUNT : amount,
                                LAUNCHURL : LAUNCHURL,
                                TYPE : "CANCELED_BET",
                                userid : mongoose.Types.ObjectId(player.id),
                                betting : {
                                    Login : indata.Login,
                                    RoundId : indata.RoundId,
                                    GameId : indata.GameId,
                                    Sequence : indata.Sequence
                                },
                                gameid : mongoose.Types.ObjectId(gameId.gameid),
                                providerid : mongoose.Types.ObjectId(gameId.providerid),
                            };
                            BASECONTROL.data_save(row, betting_historymodel);
                        }
                    } else {
                        
                        
                        var row = {
                            AMOUNT : amount,
                            LAUNCHURL : LAUNCHURL,
                            TYPE : "CANCELED_BET",
                            userid : mongoose.Types.ObjectId(player.id),
                            betting : {
                                Login : indata.Login,
                                RoundId : indata.RoundId,
                                GameId : indata.GameId,
                                Sequence : indata.Sequence
                            },
                            gameid : mongoose.Types.ObjectId(gameId.gameid),
                            providerid : mongoose.Types.ObjectId(gameId.providerid),
                        };

                        BASECONTROL.data_save(row, betting_historymodel);
                        outdata = await this.getReturnString(0, -30, false, "No game record exists for this game", false)
                        return outdata;
                    }
                } else {
                    outdata = await this.getReturnString(0, -10, true, "Player not found in Partner system");
                    return outdata;
                }
            }
            outdata = await this.getReturnString(0, 0, false, "Success call",false)
            return outdata;
        } else {
            outdata = await this.getReturnString(0, 21, true, "Transaction has already been recorded in Partner server",false)
            return outdata;
        }
    }
    
    ProcessDebit = async (req, res) => {
        let inputdata = req.body;
        let returnData = null;
        if (!inputdata['Login'] || !inputdata['OperatorId'] || !inputdata['GameId'] || !inputdata['ProviderId'] || !inputdata['Amount'] || !inputdata['TransactionId']) {
            returnData = await this.getReturnString(0, -2, true, "Obligation field missing")
            return res.json(returnData);
        }
        let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            ProviderId: inputdata.ProviderId,
            RoundId: inputdata.RoundId,
            TransactionId: inputdata.TransactionId,
            amount: inputdata.Amount == null ? 0 : parseFloat(inputdata.Amount)
        }
        returnData = await this.ProcessDebitChild(p_inputdata);
        return res.json(returnData);
    }
    
    ProcessDebitVerify = async (indata) => {
        let outdata = await BASECONTROL.BfindOne(betting_historymodel, { 
            LAUNCHURL: LAUNCHURL_betsoft, 
            TYPE: "BET",
            "betting.Login": indata.Login, 
            "betting.GameId": indata.GameId, 
            "betting.ProviderId": indata.ProviderId,
            "betting.RoundId": indata.RoundId,
            "betting.TransactionId": indata.TransactionId
        })
        return outdata;
    }
    
    ProcessDebitChild = async (indata) => {
        
        let outdata = null;
        let { Login, amount } = indata;
        let player = await BASECONTROL.playerFindByusername( Login);
        if (!player) {
            outdata = await this.getReturnString(0, -10, true, "Player not found in Partner system");
            return outdata;
        } else {
            let debitVerifyStatus = await this.ProcessDebitVerify(indata);
            if (debitVerifyStatus) {
                if (debitVerifyStatus.AMOUNT == amount) {
                    outdata = await this.getReturnString(player.balance, 21, true, "Transaction has already been recorded in Partner server")
                    return outdata;
                } else {
                    outdata = await this.getReturnString(0, -22, true, "Transaction for specified RoundID and Username already recorded for different amount")
                    return outdata;
                }
            } else {
                if (player.balance >= amount) {
                    
                    var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.GameId);
                    if (!gameId) {
                        return {status : false,error : 1,balance : player.balance,errorDescription : "General error"};
                    }

                    var row = {
                        AMOUNT : amount,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        betting : {
                            Login : indata.Login,
                            RoundId : indata.RoundId,
                            GameId : indata.GameId,
                            Sequence : indata.Sequence
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };
            
                    var wallets_ = {
                        commission:0,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        roundid :indata.RoundId,
                        transactionid : indata.RoundId,
                        lastbalance : player.balance,
                        credited : 0,
                        debited : amount
                    }


                    let afterBalance = await player_balanceupdatein(player.id, -1 * amount, wallets_);
    
                    if (afterBalance === false) {
                        outdata = await this.getReturnString(0, -1, true, "Unknown error");
                        return outdata;
                    } else {
                       
                        BASECONTROL.data_save(row, betting_historymodel);
                        outdata = await this.getReturnString(afterBalance, 0, false, "Success call");
                        return outdata;
                    }
                } else {
                    outdata = await this.getReturnString(0, -20, true, "InsufficientFunds Player balance is insufficient to place bet");
                    return outdata;
                }
            }
        }
    }
    
    ProcessCredit = async (req, res) => {
        let inputdata = req.body;
        let returnData = null;
        if (!inputdata['Login'] || !inputdata['OperatorId'] || !inputdata['GameId'] || !inputdata['ProviderId'] || !inputdata['RoundId'] || !inputdata['TransactionId'] ) {
            returnData = await this.getReturnString(0, -2, true, "Obligation field missing")
            return res.json(returnData);
        }
        let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            ProviderId: inputdata.ProviderId,
            RoundId: inputdata.RoundId,
            TransactionId: inputdata.TransactionId,
            amount: inputdata.Amount === null ? 0 : parseFloat(inputdata.Amount)
        }
        returnData = await this.ProcessCreditChild(p_inputdata)
        return res.json(returnData);
    }
    
    ProcessCreditVerify = async (indata) => {
        let data = await BASECONTROL.BfindOne(betting_historymodel, {
            LAUNCHURL: LAUNCHURL_betsoft,
            TYPE: "WIN",
            "betting.Login": indata.Login, 
            "betting.GameId": indata.GameId, 
            "betting.ProviderId": indata.ProviderId,
            "betting.RoundId": indata.RoundId,
            "betting.TransactionId": indata.TransactionId,
        })
        return data;
    }
    
    ProcessCreditBetVerify = async (indata) => {
        let data = await BASECONTROL.BfindOne(betting_historymodel, {
            LAUNCHURL: LAUNCHURL_betsoft,
            TYPE: "BET",
            "betting.Login": indata.Login, 
            "betting.GameId": indata.GameId, 
            "betting.ProviderId": indata.ProviderId,
            "betting.RoundId": indata.RoundId
        })
        return data;
    }
    
    ProcessCreditChild = async (indata) => {
        
        let { amount, Login } = indata;
        let outdata = null;
        let player = await BASECONTROL.playerFindByusername( Login);
        if (player) {
            let lastwin = await this.ProcessCreditVerify(indata);
            if (!lastwin) {

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.GameId);
                if (!gameId) {
                    outdata = await this.getReturnString(0, -1, true, "Unknown error")
                    return outdata;
                }
                    
                var row = {
                    AMOUNT : amount,
                    LAUNCHURL : LAUNCHURL,
                    TYPE : "WIN",
                    userid : mongoose.Types.ObjectId(player.id),
                    betting : {
                        Login : indata.Login,
                        RoundId : indata.RoundId,
                        GameId : indata.GameId,
                        Sequence : indata.Sequence
                    },
                    gameid : mongoose.Types.ObjectId(gameId.gameid),
                    providerid : mongoose.Types.ObjectId(gameId.providerid),
                };

                let lastbet = await this.ProcessCreditBetVerify(indata);
                if (!lastbet) {
                   
                    await BASECONTROL.data_save(row, betting_historymodel);
                    outdata = await this.getReturnString(player.balance, -30, true, "No game record exists for this game");
                    return outdata;
                } else {
                    
                    var wallets_ = {
                        commission:0,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"WIN",
                        userid : mongoose.Types.ObjectId(player.id),
                        roundid :indata.RoundId,
                        transactionid : indata.RoundId,
                        lastbalance : player.balance,
                        credited : amount,
                        debited : 0
                    }

                    let afterBalance = await player_balanceupdatein(player.id, amount, wallets_);
                    if (afterBalance === false) {
                        outdata = await this.getReturnString(0, -1, true, "Unknown error")
                        return outdata;
                    } else {
                        BASECONTROL.data_save(row, betting_historymodel);
                        outdata = await this.getReturnString(afterBalance, 0, false, "Success call")
                        return outdata;
                    }
                }
            } else {
                if (lastwin.AMOUNT == amount || lastwin.AMOUNT == 0) {
                    outdata = await this.getReturnString(player.balance, 21, true, "Transaction has already been recorded in Partner server")
                    return outdata;
                } else {
                    outdata = await this.getReturnString(0, -22, true, "Transaction for specified RoundID and Username already recorded for different amount")
                    return outdata;
                }
            }
        } else {
            outdata = await this.getReturnString(0, -10, true, "Player not found in Partner system");
            return outdata;
        }
    }
    
    PerformRefund = async (req, res) => {
        let inputdata = req.body;
        let returnData = null;
    
        if (!inputdata['Login'] || !inputdata['OperatorId'] || !inputdata['GameId'] || !inputdata['ProviderId'] || !inputdata['RoundId'] || !inputdata['TransactionId']) {        
            returnData = await this.getReturnString(0, -2, true, "Obligation field missing")
            return res.json(returnData);
        }
        let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            ProviderId: inputdata.ProviderId,
            RoundId: inputdata.RoundId,
            TransactionId: inputdata.TransactionId
        }
        returnData = await this.PerformRefundChild(p_inputdata)
        return res.json(returnData);
    }
    
    PerformRefundVerify = async (inputdata) => {
        let data = await BASECONTROL.BfindOne(betting_historymodel, {
            LAUNCHURL: LAUNCHURL_betsoft,
            TYPE: "CANCELED_BET",
            "betting.Login": inputdata.Login,
            "betting.GameId": inputdata.GameId,
            "betting.ProviderId": inputdata.ProviderId,
            "betting.RoundId": inputdata.RoundId,
            "betting.TransactionId": inputdata.TransactionId
        })
        return data;
    }
    
    PerformRefundDebitVerify = async (inputdata) => {
        let data = await BASECONTROL.BfindOne(betting_historymodel, {
            LAUNCHURL: LAUNCHURL_betsoft,
            TYPE: "BET",
            "betting.Login": inputdata.Login,
            "betting.GameId": inputdata.GameId,
            "betting.ProviderId": inputdata.ProviderId,
            "betting.RoundId": inputdata.RoundId,
            "betting.TransactionId": inputdata.TransactionId.split("Refund")[0]
        })
        return data;
    }
    
    PerformRefundChild = async (indata) => {
    
    let outdata = null;
        let player = await BASECONTROL.playerFindByusername( indata.Login);
        if (player) {
            let lastCancel = await this.PerformRefundVerify(indata);
            if (lastCancel) {
                outdata = await this.getReturnString(player.balance, 21, true, "Transaction has already been recorded in Partner server")
                return outdata;
            } else {

                var gameId = await BASECONTROL.get_gameid(LAUNCHURL,indata.GameId);
                if (!gameId) {
                    outdata = await this.getReturnString(0, -1, true, "Unknown error")
                    return outdata;
                }
                    
                
                
                let debitVerifyStatus = await this.PerformRefundDebitVerify(indata);
                if (!debitVerifyStatus) {
                    var row = {
                        AMOUNT : 0,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "CANCELED_BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        betting : {
                            Login : indata.Login,
                            RoundId : indata.RoundId,
                            GameId : indata.GameId,
                            Sequence : indata.Sequence
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };
                    await BASECONTROL.data_save(row, betting_historymodel);
                    outdata = await this.getReturnString(player.balance, -30, true, "No game record exists for this game")
                    return outdata;
                } else if(debitVerifyStatus.AMOUNT === 0) {
                    outdata = await this.getReturnString(player.balance, 21, true, "Transaction has already been recorded in Partner server")
                    return outdata;
                } else {
                    var row = {
                        AMOUNT : debitVerifyStatus.AMOUNT,
                        LAUNCHURL : LAUNCHURL,
                        TYPE : "CANCELED_BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        betting : {
                            Login : indata.Login,
                            RoundId : indata.RoundId,
                            GameId : indata.GameId,
                            Sequence : indata.Sequence
                        },
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        providerid : mongoose.Types.ObjectId(gameId.providerid),
                    };

                    var wallets_ = {
                        commission:0,
                        gameid : mongoose.Types.ObjectId(gameId.gameid),
                        status :"CANCELED_BET",
                        userid : mongoose.Types.ObjectId(player.id),
                        roundid :indata.RoundId,
                        transactionid : indata.RoundId,
                        lastbalance : player.balance,
                        credited : debitVerifyStatus.AMOUNT,
                        debited : 0
                    }

                    let afterBalance = await player_balanceupdatein(player.id, debitVerifyStatus.AMOUNT, wallets_);
                    if (afterBalance === false) {
                        outdata = await this.getReturnString(0, -1, true, "Unknown error")
                        return outdata;
                    } else {
                       
                        BASECONTROL.data_save(row, betting_historymodel);
                        outdata = await this.getReturnString(afterBalance, 0, false, "Success call")
                        return outdata;
                    }
                }
            }
        } else {
            outdata = await this.getReturnString(0, -10, true, "Player not found in Partner system");
            return outdata;
        }
    }
    
}