const { parentPort } = require("worker_threads");
const models =require("../Schema")
const LAUNCHURL = "2"
const mongoose = require("mongoose");

const firstpagesetting = models.firstpagesetting
const wallethistory_model = models.wallethistory_model
const gamesessionmodel = models.gamesessionmodel
const playersUser = models.playersUser
const session_model = models.session_model
const betting_historymodel = models.betting_historymodel
const Gamelist = models.Gamelist

parentPort.on("message", async (data) => {
  console.time()
  const router = data.router;
  const inputdata = data.data;
    
    class XpgController {
        constructor() {}
      
        getReturnString = async (data, ErrorCode, HasErrors, Message, key = true) => {
          if (key) {
            let returnData = {
              d: {
                Data: [parseFloat(data).toFixed(2)],
                ErrorCode: ErrorCode,
                HasErrors: HasErrors,
                Message: Message,
              },
            };
            return returnData;
          } else {
            let returnData = {
              d: {
                ErrorCode: ErrorCode,
                HasErrors: HasErrors,
                Message: Message,
              },
            };
            return returnData;
          }
        };
      
        PlayerGetBalance = async (inputdata) => {
          // let inputdata = ;
          let returnData = null;
          if (!inputdata["Login"] || !inputdata["OperatorId"]) {
            returnData = await this.getReturnString(
              0,
              -2,
              true,
              "Obligation field missing"
            );
            return returnData;
          }
      
          sesssion_update_username(inputdata["Login"]);
      
          returnData = await this.PlayerGetBalanceChild(inputdata["Login"]);
          return returnData;
        };
      
        PlayerGetBalanceChild = async (username) => {
          let outdata = null;
          let rdata = await playerFindByusername(username);
          if (!rdata) {
            outdata = await this.getReturnString(
              0,
              -10,
              true,
              "Player not found in Partner system"
            );
          } else {
            outdata = await this.getReturnString(
              rdata.balance,
              0,
              false,
              "Success call"
            );
          }
          return outdata;
        };
      
        Debit = async (inputdata) => {
          // let inputdata = req.body;
          let returnData = null;
          if (
            inputdata.DebitDetails === undefined ||
            !inputdata["Login"] ||
            !inputdata["OperatorId"] ||
            !inputdata["GameId"] ||
            !inputdata["RoundId"] ||
            !inputdata["Amount"] ||
            !inputdata["Sequence"]
          ) {
            returnData = await this.getReturnString(
              0,
              -2,
              true,
              "Obligation field missing"
            );
            return returnData;
          }
          let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            RoundId: inputdata.RoundId,
            amount: inputdata.Amount == null ? 0 : parseFloat(inputdata.Amount),
            Sequence: inputdata.Sequence,
            DebitDetails: inputdata.DebitDetails,
          };
          returnData = await this.DebitChild(p_inputdata);
          // setTimeout(() => {
          return returnData;
          // }, 3000);
        };
      
        debitVerify = async (indata) => {
          let outdata = await BfindOne(betting_historymodel, {
            // LAUNCHURL,
            TYPE: "BET",
            "betting.Login": indata.Login,
            "betting.RoundId": indata.RoundId,
            "betting.GameId": indata.GameId,
            "betting.Sequence": indata.Sequence,
          });
          return outdata;
        };
      
        DebitChild = async (indata) => {
          let outdata = null;
          let { Login, amount } = indata;
          console.log(indata,"--indata--")
          let player = await playerFindByusername(Login);
          if (!player) {
            outdata = await this.getReturnString(
              0,
              -10,
              true,
              "Player not found in Partner system"
            );
            return outdata;
          } else {
            let debitVerifyStatus = await this.debitVerify(indata);
            if (debitVerifyStatus) {
              if (debitVerifyStatus.AMOUNT == amount) {
                outdata = await this.getReturnString(
                  player.balance,
                  21,
                  true,
                  "Transaction has already been recorded in Partner server"
                );
                return outdata;
              } else {
                outdata = await this.getReturnString(
                  0,
                  -22,
                  true,
                  "Transaction for specified RoundID and Username already recorded for different amount"
                );
                return outdata;
              }
            } else {
              if (player.balance >= amount) {
                var gameId = await get_gameid(LAUNCHURL, indata.GameId);
                if (!gameId) {
                  outdata = await this.getReturnString(0, -1, true, "Unknown error");
                  return outdata;
                }
                var row = {
                  AMOUNT: amount,
                  LAUNCHURL: LAUNCHURL,
                  TYPE: "BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  betting: {
                    Login: indata.Login,
                    RoundId: indata.RoundId,
                    GameId: indata.GameId,
                    Sequence: indata.Sequence,
                    prevbalance: player.balance
                  },
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  providerid: mongoose.Types.ObjectId(gameId.providerid),
                  transactionId: indata.RoundId,
                    roundId: indata.RoundId,
                };
      
                var wallets_ = {
                  commission: 0,
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  status: "BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  roundid: indata.RoundId,
                  transactionid: indata.RoundId,
                  lastbalance: player.balance,
                  credited: 0,
                  debited: amount,
                };
      
                let afterBalance = await player_balanceupdatein(
                  player.id,
                  -1 * amount,
                  wallets_
                );
                if (afterBalance === false) {
                  outdata = await this.getReturnString(0, -1, true, "Unknown error");
                  return outdata;
                } else {
                  data_save(row, betting_historymodel);
                  outdata = await this.getReturnString(
                    afterBalance,
                    0,
                    false,
                    "Success call"
                  );
                  return outdata;
                }
              } else {
                outdata = await this.getReturnString(
                  0,
                  -20,
                  true,
                  "InsufficientFunds Player balance is insufficient to place bet"
                );
                return outdata;
              }
            }
          }
        };
      
        Credit = async (inputdata) => {
          // let inputdata = req.body;
          let returnData = null;
          if (
            inputdata.CreditDetails === undefined ||
            !inputdata["Login"] ||
            !inputdata["OperatorId"] ||
            !inputdata["GameId"] ||
            !inputdata["RoundId"]
          ) {
            returnData = await this.getReturnString(
              0,
              -2,
              true,
              "Obligation field missing"
            );
            return returnData;
          }
          let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            RoundId: inputdata.RoundId,
            amount: inputdata.Amount === null ? 0 : parseFloat(inputdata.Amount),
            CreditDetails: inputdata.CreditDetails,
          };
          returnData = await this.creditChild(p_inputdata);
          return returnData;
        };
      
        creditVerify = async (indata) => {
          let data = await BfindOne(betting_historymodel, {
            LAUNCHURL,
            TYPE: "WIN",
            "betting.Login": indata.Login,
            "betting.RoundId": indata.RoundId,
            "betting.GameId": indata.GameId,
          });
          return data;
        };
      
        creditBetVerify = async (indata) => {
          let data = await BfindOne(betting_historymodel, {
            LAUNCHURL,
            TYPE: "BET",
            "betting.Login": indata.Login,
            "betting.RoundId": indata.RoundId,
            "betting.GameId": indata.GameId,
          });
          return data;
        };
      
        creditChild = async (indata) => {
          let { amount, Login } = indata;
          let outdata = null;
          let player = await playerFindByusername(Login);
          if (player) {
            let lastwin = await this.creditVerify(indata);
            if (!lastwin) {
              var gameId = await get_gameid(LAUNCHURL, indata.GameId);
              if (!gameId) {
                outdata = await this.getReturnString(0, -1, true, "Unknown error");
                return outdata;
              }
      
              var row = {
                AMOUNT: amount,
                LAUNCHURL: LAUNCHURL,
                TYPE: "WIN",
                userid: mongoose.Types.ObjectId(player.id),
                betting: {
                  Login: indata.Login,
                  RoundId: indata.RoundId,
                  GameId: indata.GameId,
                  Sequence: indata.Sequence,
                  prevbalance: player.balance
                },
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                providerid: mongoose.Types.ObjectId(gameId.providerid),
                transactionId: indata.RoundId,
                    roundId: indata.RoundId,
              };
      
              let lastbet = await this.creditBetVerify(indata);
              if (!lastbet) {
                await data_save(row, betting_historymodel);
                outdata = await this.getReturnString(
                  player.balance,
                  -30,
                  true,
                  "No game record exists for this game"
                );
                return outdata;
              } else {
                var wallets_ = {
                  commission: 0,
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  status: "WIN",
                  userid: mongoose.Types.ObjectId(player.id),
                  roundid: indata.RoundId,
                  transactionid: indata.RoundId,
                  lastbalance: player.balance,
                  credited: amount,
                  debited: 0,
                };
      
                let afterBalance = await player_balanceupdatein(
                  player.id,
                  amount,
                  wallets_
                );
                if (afterBalance === false) {
                  outdata = await this.getReturnString(0, -1, true, "Unknown error");
                  return outdata;
                } else {
                  data_save(row, betting_historymodel);
                  outdata = await this.getReturnString(
                    afterBalance,
                    0,
                    false,
                    "Success call"
                  );
                  return outdata;
                }
              }
            } else {
              if (lastwin.AMOUNT == amount || lastwin.AMOUNT == 0) {
                outdata = await this.getReturnString(
                  player.balance,
                  21,
                  true,
                  "Transaction has already been recorded in Partner server"
                );
                return outdata;
              } else {
                outdata = await this.getReturnString(
                  0,
                  -22,
                  true,
                  "Transaction for specified RoundID and Username already recorded for different amount"
                );
                return outdata;
              }
            }
          } else {
            outdata = await this.getReturnString(
              0,
              -10,
              true,
              "Player not found in Partner system"
            );
            return outdata;
          }
        };
      
        CancelTransaction = async (inputdata) => {
          // let inputdata = req.body;
          let returnData = null;
          if (
            !inputdata["Login"] ||
            !inputdata["OperatorId"] ||
            !inputdata["GameId"] ||
            !inputdata["RoundId"] ||
            !inputdata["Sequence"]
          ) {
            returnData = await this.getReturnString(
              0,
              -2,
              true,
              "Obligation field missing"
            );
            return returnData;
          }
          let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            RoundId: inputdata.RoundId,
            Sequence: inputdata.Sequence,
          };
          let rdata = await this.cancelChild(p_inputdata);
          return rdata;
        };
      
        cancelVerify = async (inputdata) => {
          let data = await BfindOne(betting_historymodel, {
            LAUNCHURL,
            TYPE: "CANCELED_BET",
            "betting.Login": inputdata.Login,
            "betting.RoundId": inputdata.RoundId,
            "betting.GameId": inputdata.GameId,
            "betting.Sequence": inputdata.Sequence,
          });
          return data;
        };
      
        cancelChild = async (indata) => {
          let outdata = null;
          let player = await playerFindByusername(indata.Login);
          if (player) {
            let lastCancel = await this.cancelVerify(indata);
            if (lastCancel) {
              outdata = await this.getReturnString(
                player.balance,
                21,
                true,
                "Transaction has already been recorded in Partner server"
              );
              return outdata;
            } else {
              var gameId = await get_gameid(LAUNCHURL, indata.GameId);
              if (!gameId) {
                outdata = await this.getReturnString(0, -1, true, "Unknown error");
                return outdata;
              }
      
              let debitVerifyStatus = await this.debitVerify(indata);
              if (!debitVerifyStatus) {
                var row = {
                  AMOUNT: 0,
                  LAUNCHURL: LAUNCHURL,
                  TYPE: "CANCELED_BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  betting: {
                    Login: indata.Login,
                    RoundId: indata.RoundId,
                    GameId: indata.GameId,
                    Sequence: indata.Sequence,
                    prevbalance: player.balance
                  },
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  providerid: mongoose.Types.ObjectId(gameId.providerid),
                  transactionId: indata.RoundId,
                    roundId: indata.RoundId,
                };
                await data_save(row, betting_historymodel);
                outdata = await this.getReturnString(
                  player.balance,
                  -30,
                  true,
                  "No game record exists for this game"
                );
                return outdata;
              } else if (debitVerifyStatus.AMOUNT === 0) {
                outdata = await this.getReturnString(
                  player.balance,
                  21,
                  true,
                  "Transaction has already been recorded in Partner server"
                );
                return outdata;
              } else {
                var row = {
                  AMOUNT: debitVerifyStatus.AMOUNT,
                  LAUNCHURL: LAUNCHURL,
                  TYPE: "CANCELED_BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  betting: {
                    Login: indata.Login,
                    RoundId: indata.RoundId,
                    GameId: indata.GameId,
                    Sequence: indata.Sequence,
                  },
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  providerid: mongoose.Types.ObjectId(gameId.providerid),
                };
      
                var wallets_ = {
                  commission: 0,
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  status: "CANCELED_BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  roundid: indata.RoundId,
                  transactionid: indata.RoundId,
                  lastbalance: player.balance,
                  credited: debitVerifyStatus.AMOUNT,
                  debited: 0,
                };
      
                let afterBalance = await player_balanceupdatein(
                  player.id,
                  debitVerifyStatus.AMOUNT,
                  wallets_
                );
                if (afterBalance === false) {
                  outdata = await this.getReturnString(0, -1, true, "Unknown error");
                  return outdata;
                } else {
                  data_save(row, betting_historymodel);
                  outdata = await this.getReturnString(
                    afterBalance,
                    0,
                    false,
                    "Success call"
                  );
                  return outdata;
                }
              }
            }
          } else {
            outdata = await this.getReturnString(
              0,
              -10,
              true,
              "Player not found in Partner system"
            );
            return outdata;
          }
        };
      
        CancelRound = async (inputdata) => {
          // let inputdata = req.body;
          let returnData = null;
          if ( !inputdata["Logins"] || !inputdata["OperatorId"] || !inputdata["GameId"] || !inputdata["RoundId"] ) {

            returnData = await this.getReturnString(
              0,
              -2,
              true,
              "Obligation field missing",
              false
              );
              return returnData;
            }

          let p_inputdata = {
            Logins: inputdata.Logins,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            RoundId: inputdata.RoundId,
          };
          let rdata = await this.cancelRoundChild(p_inputdata);
          console.log(rdata,"--rdata---return data")
          return rdata;
        };
      
        cancelRoundVerify = async (indata) => {
          let data = await BfindOne(betting_historymodel, {
            LAUNCHURL,
            TYPE: "CANCELED_BET",
            "betting.RoundId": indata.RoundId,
            "betting.GameId": indata.GameId,
          });
          return data;
        };
      
        Round_debit = async (indata, userid) => {
          let data = await Bfind(betting_historymodel, {
            LAUNCHURL,
            TYPE: "BET",
            "betting.Login": userid,
            "betting.RoundId": indata.RoundId,
            "betting.GameId": indata.GameId,
            $nor: [{ "betting.Sequence": 1001 }],
          });
          return data;
        };
      
        cancelRoundChild = async (indata) => {
          let users = indata.Logins;
          let lastround = await this.cancelRoundVerify(indata);
          let outdata = null;
          if (!lastround) {
            var gameId = await get_gameid(LAUNCHURL, indata.GameId);
            if (!gameId) {
              outdata = await this.getReturnString(0, -1, true, "Unknown error");
              return outdata;
            }
            for (let i = 0; i < users.length; i++) {
              let player = await playerFindByusername(users[i]);
              if (player) {
                let lastbets = await this.Round_debit(indata, users[i]);
      
                let amount = 0;
                if (lastbets && lastbets.length > 0) {
      
                  for (let j = 0; j < lastbets.length; j++) {
                    amount += lastbets[j].AMOUNT;
                  }
      
                  var wallets_ = {
                    commission: 0,
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    status: "CANCELED_BET",
                    userid: mongoose.Types.ObjectId(player.id),
                    roundid: indata.RoundId,
                    transactionid: indata.RoundId,
                    lastbalance: player.balance,
                    credited: amount,
                    debited: 0,
                  };
                  let afterBalance = await player_balanceupdatein(
                    player.id,
                    amount,
                    wallets_
                  );
                  if (afterBalance !== false) {
                    var row = {
                      AMOUNT: amount,
                      LAUNCHURL: LAUNCHURL,
                      TYPE: "CANCELED_BET",
                      userid: mongoose.Types.ObjectId(player.id),
                      betting: {
                        Login: indata.Login,
                        RoundId: indata.RoundId,
                        GameId: indata.GameId,
                        Sequence: indata.Sequence,
                      },
                      gameid: mongoose.Types.ObjectId(gameId.gameid),
                      providerid: mongoose.Types.ObjectId(gameId.providerid),
                    };
                    data_save(row, betting_historymodel);
                  }
                } else {
                  var row = {
                    AMOUNT: amount,
                    LAUNCHURL: LAUNCHURL,
                    TYPE: "CANCELED_BET",
                    userid: mongoose.Types.ObjectId(player.id),
                    betting: {
                      Login: indata.Login,
                      RoundId: indata.RoundId,
                      GameId: indata.GameId,
                      Sequence: indata.Sequence,
                    },
                    gameid: mongoose.Types.ObjectId(gameId.gameid),
                    providerid: mongoose.Types.ObjectId(gameId.providerid),
                  };
      
                  data_save(row, betting_historymodel);
                  outdata = await this.getReturnString(
                    0,
                    -30,
                    false,
                    "No game record exists for this game",
                    false
                  );
                  return outdata;
                }
              } else {
                outdata = await this.getReturnString(
                  0,
                  -10,
                  true,
                  "Player not found in Partner system"
                );
                return outdata;
              }
            }
            outdata = await this.getReturnString(0, 0, false, "Success call", false);
            return outdata;
          } else {
            outdata = await this.getReturnString(
              0,
              21,
              true,
              "Transaction has already been recorded in Partner server",
              false
            );
            return outdata;
          }
        };
      
        ProcessDebit = async (inputdata) => {
          // let inputdata = req.body;
          let returnData = null;
          if (
            !inputdata["Login"] ||
            !inputdata["OperatorId"] ||
            !inputdata["GameId"] ||
            !inputdata["ProviderId"] ||
            !inputdata["Amount"] ||
            !inputdata["TransactionId"]
          ) {
            returnData = await this.getReturnString(
              0,
              -2,
              true,
              "Obligation field missing"
            );
            return returnData;
          }
          let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            ProviderId: inputdata.ProviderId,
            RoundId: inputdata.RoundId,
            TransactionId: inputdata.TransactionId,
            amount: inputdata.Amount == null ? 0 : parseFloat(inputdata.Amount),
          };
          returnData = await this.ProcessDebitChild(p_inputdata);
          return returnData;
        };
      
        ProcessDebitVerify = async (indata) => {
          let outdata = await BfindOne(betting_historymodel, {
            LAUNCHURL: LAUNCHURL_betsoft,
            TYPE: "BET",
            "betting.Login": indata.Login,
            "betting.GameId": indata.GameId,
            "betting.ProviderId": indata.ProviderId,
            "betting.RoundId": indata.RoundId,
            "betting.TransactionId": indata.TransactionId,
          });
          return outdata;
        };
      
        ProcessDebitChild = async (indata) => {
          let outdata = null;
          let { Login, amount } = indata;
          let player = await playerFindByusername(Login);
          if (!player) {
            outdata = await this.getReturnString(
              0,
              -10,
              true,
              "Player not found in Partner system"
            );
            return outdata;
          } else {
            let debitVerifyStatus = await this.ProcessDebitVerify(indata);
            if (debitVerifyStatus) {
              if (debitVerifyStatus.AMOUNT == amount) {
                outdata = await this.getReturnString(
                  player.balance,
                  21,
                  true,
                  "Transaction has already been recorded in Partner server"
                );
                return outdata;
              } else {
                outdata = await this.getReturnString(
                  0,
                  -22,
                  true,
                  "Transaction for specified RoundID and Username already recorded for different amount"
                );
                return outdata;
              }
            } else {
              if (player.balance >= amount) {
                var gameId = await get_gameid(LAUNCHURL, indata.GameId);
                if (!gameId) {
                  return {
                    status: false,
                    error: 1,
                    balance: player.balance,
                    errorDescription: "General error",
                  };
                }
      
                var row = {
                  AMOUNT: amount,
                  LAUNCHURL: LAUNCHURL,
                  TYPE: "BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  betting: {
                    Login: indata.Login,
                    RoundId: indata.RoundId,
                    GameId: indata.GameId,
                    Sequence: indata.Sequence,
                  },
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  providerid: mongoose.Types.ObjectId(gameId.providerid),
                };
      
                var wallets_ = {
                  commission: 0,
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  status: "BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  roundid: indata.RoundId,
                  transactionid: indata.RoundId,
                  lastbalance: player.balance,
                  credited: 0,
                  debited: amount,
                };
      
                let afterBalance = await player_balanceupdatein(
                  player.id,
                  -1 * amount,
                  wallets_
                );
      
                if (afterBalance === false) {
                  outdata = await this.getReturnString(0, -1, true, "Unknown error");
                  return outdata;
                } else {
                  data_save(row, betting_historymodel);
                  outdata = await this.getReturnString(
                    afterBalance,
                    0,
                    false,
                    "Success call"
                  );
                  return outdata;
                }
              } else {
                outdata = await this.getReturnString(
                  0,
                  -20,
                  true,
                  "InsufficientFunds Player balance is insufficient to place bet"
                );
                return outdata;
              }
            }
          }
        };
      
        ProcessCredit = async (inputdata) => {
          // let inputdata = req.body;
          let returnData = null;
          if (
            !inputdata["Login"] ||
            !inputdata["OperatorId"] ||
            !inputdata["GameId"] ||
            !inputdata["ProviderId"] ||
            !inputdata["RoundId"] ||
            !inputdata["TransactionId"]
          ) {
            returnData = await this.getReturnString(
              0,
              -2,
              true,
              "Obligation field missing"
            );
            return returnData;
          }
          let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            ProviderId: inputdata.ProviderId,
            RoundId: inputdata.RoundId,
            TransactionId: inputdata.TransactionId,
            amount: inputdata.Amount === null ? 0 : parseFloat(inputdata.Amount),
          };
          returnData = await this.ProcessCreditChild(p_inputdata);
          return returnData;
        };
      
        ProcessCreditVerify = async (indata) => {
          let data = await BfindOne(betting_historymodel, {
            LAUNCHURL: LAUNCHURL_betsoft,
            TYPE: "WIN",
            "betting.Login": indata.Login,
            "betting.GameId": indata.GameId,
            "betting.ProviderId": indata.ProviderId,
            "betting.RoundId": indata.RoundId,
            "betting.TransactionId": indata.TransactionId,
          });
          return data;
        };
      
        ProcessCreditBetVerify = async (indata) => {
          let data = await BfindOne(betting_historymodel, {
            LAUNCHURL: LAUNCHURL_betsoft,
            TYPE: "BET",
            "betting.Login": indata.Login,
            "betting.GameId": indata.GameId,
            "betting.ProviderId": indata.ProviderId,
            "betting.RoundId": indata.RoundId,
          });
          return data;
        };
      
        ProcessCreditChild = async (indata) => {
          let { amount, Login } = indata;
          let outdata = null;
          let player = await playerFindByusername(Login);
          if (player) {
            let lastwin = await this.ProcessCreditVerify(indata);
            if (!lastwin) {
              var gameId = await get_gameid(LAUNCHURL, indata.GameId);
              if (!gameId) {
                outdata = await this.getReturnString(0, -1, true, "Unknown error");
                return outdata;
              }
      
              var row = {
                AMOUNT: amount,
                LAUNCHURL: LAUNCHURL,
                TYPE: "WIN",
                userid: mongoose.Types.ObjectId(player.id),
                betting: {
                  Login: indata.Login,
                  RoundId: indata.RoundId,
                  GameId: indata.GameId,
                  Sequence: indata.Sequence,
                },
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                providerid: mongoose.Types.ObjectId(gameId.providerid),
              };
      
              let lastbet = await this.ProcessCreditBetVerify(indata);
              if (!lastbet) {
                await data_save(row, betting_historymodel);
                outdata = await this.getReturnString(
                  player.balance,
                  -30,
                  true,
                  "No game record exists for this game"
                );
                return outdata;
              } else {
                var wallets_ = {
                  commission: 0,
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  status: "WIN",
                  userid: mongoose.Types.ObjectId(player.id),
                  roundid: indata.RoundId,
                  transactionid: indata.RoundId,
                  lastbalance: player.balance,
                  credited: amount,
                  debited: 0,
                };
      
                let afterBalance = await player_balanceupdatein(
                  player.id,
                  amount,
                  wallets_
                );
                if (afterBalance === false) {
                  outdata = await this.getReturnString(0, -1, true, "Unknown error");
                  return outdata;
                } else {
                  data_save(row, betting_historymodel);
                  outdata = await this.getReturnString(
                    afterBalance,
                    0,
                    false,
                    "Success call"
                  );
                  return outdata;
                }
              }
            } else {
              if (lastwin.AMOUNT == amount || lastwin.AMOUNT == 0) {
                outdata = await this.getReturnString(
                  player.balance,
                  21,
                  true,
                  "Transaction has already been recorded in Partner server"
                );
                return outdata;
              } else {
                outdata = await this.getReturnString(
                  0,
                  -22,
                  true,
                  "Transaction for specified RoundID and Username already recorded for different amount"
                );
                return outdata;
              }
            }
          } else {
            outdata = await this.getReturnString(
              0,
              -10,
              true,
              "Player not found in Partner system"
            );
            return outdata;
          }
        };
      
        PerformRefund = async (inputdata) => {
          // let inputdata = req.body;
          let returnData = null;
      
          if (
            !inputdata["Login"] ||
            !inputdata["OperatorId"] ||
            !inputdata["GameId"] ||
            !inputdata["ProviderId"] ||
            !inputdata["RoundId"] ||
            !inputdata["TransactionId"]
          ) {
            returnData = await this.getReturnString(
              0,
              -2,
              true,
              "Obligation field missing"
            );
            return returnData;
          }
          let p_inputdata = {
            Login: inputdata.Login,
            OperatorId: inputdata.OperatorId,
            GameId: inputdata.GameId,
            ProviderId: inputdata.ProviderId,
            RoundId: inputdata.RoundId,
            TransactionId: inputdata.TransactionId,
          };
          returnData = await this.PerformRefundChild(p_inputdata);
          return returnData;
        };
      
        PerformRefundVerify = async (inputdata) => {
          let data = await BfindOne(betting_historymodel, {
            LAUNCHURL: LAUNCHURL_betsoft,
            TYPE: "CANCELED_BET",
            "betting.Login": inputdata.Login,
            "betting.GameId": inputdata.GameId,
            "betting.ProviderId": inputdata.ProviderId,
            "betting.RoundId": inputdata.RoundId,
            "betting.TransactionId": inputdata.TransactionId,
          });
          return data;
        };
      
        PerformRefundDebitVerify = async (inputdata) => {
          let data = await BfindOne(betting_historymodel, {
            LAUNCHURL: LAUNCHURL_betsoft,
            TYPE: "BET",
            "betting.Login": inputdata.Login,
            "betting.GameId": inputdata.GameId,
            "betting.ProviderId": inputdata.ProviderId,
            "betting.RoundId": inputdata.RoundId,
            "betting.TransactionId": inputdata.TransactionId.split("Refund")[0],
          });
          return data;
        };
      
        PerformRefundChild = async (indata) => {
          let outdata = null;
          let player = await playerFindByusername(indata.Login);
          if (player) {
            let lastCancel = await this.PerformRefundVerify(indata);
            if (lastCancel) {
              outdata = await this.getReturnString(
                player.balance,
                21,
                true,
                "Transaction has already been recorded in Partner server"
              );
              return outdata;
            } else {
              var gameId = await get_gameid(LAUNCHURL, indata.GameId);
              if (!gameId) {
                outdata = await this.getReturnString(0, -1, true, "Unknown error");
                return outdata;
              }
      
              let debitVerifyStatus = await this.PerformRefundDebitVerify(indata);
              if (!debitVerifyStatus) {
                var row = {
                  AMOUNT: 0,
                  LAUNCHURL: LAUNCHURL,
                  TYPE: "CANCELED_BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  betting: {
                    Login: indata.Login,
                    RoundId: indata.RoundId,
                    GameId: indata.GameId,
                    Sequence: indata.Sequence,
                  },
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  providerid: mongoose.Types.ObjectId(gameId.providerid),
                };
                await data_save(row, betting_historymodel);
                outdata = await this.getReturnString(
                  player.balance,
                  -30,
                  true,
                  "No game record exists for this game"
                );
                return outdata;
              } else if (debitVerifyStatus.AMOUNT === 0) {
                outdata = await this.getReturnString(
                  player.balance,
                  21,
                  true,
                  "Transaction has already been recorded in Partner server"
                );
                return outdata;
              } else {
                var row = {
                  AMOUNT: debitVerifyStatus.AMOUNT,
                  LAUNCHURL: LAUNCHURL,
                  TYPE: "CANCELED_BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  betting: {
                    Login: indata.Login,
                    RoundId: indata.RoundId,
                    GameId: indata.GameId,
                    Sequence: indata.Sequence,
                  },
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  providerid: mongoose.Types.ObjectId(gameId.providerid),
                };
      
                var wallets_ = {
                  commission: 0,
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  status: "CANCELED_BET",
                  userid: mongoose.Types.ObjectId(player.id),
                  roundid: indata.RoundId,
                  transactionid: indata.RoundId,
                  lastbalance: player.balance,
                  credited: debitVerifyStatus.AMOUNT,
                  debited: 0,
                };
      
                let afterBalance = await player_balanceupdatein(
                  player.id,
                  debitVerifyStatus.AMOUNT,
                  wallets_
                );
                if (afterBalance === false) {
                  outdata = await this.getReturnString(0, -1, true, "Unknown error");
                  return outdata;
                } else {
                  data_save(row, betting_historymodel);
                  outdata = await this.getReturnString(
                    afterBalance,
                    0,
                    false,
                    "Success call"
                  );
                  return outdata;
                }
              }
            }
          } else {
            outdata = await this.getReturnString(
              0,
              -10,
              true,
              "Player not found in Partner system"
            );
            return outdata;
          }
        };
    }

  let result = {};
  const xpgcontrol = new XpgController();
  switch (router) {
    case "PlayerGetBalance":
      result = await xpgcontrol.PlayerGetBalance(inputdata);
      break;
    case "Debit":
      result = await xpgcontrol.Debit(inputdata);
      break;
    case "Credit":
      result = await xpgcontrol.Credit(inputdata);
      break;
    case "CancelTransaction":
      result = await xpgcontrol.CancelTransaction(inputdata);
      break;
    case "CancelRound":
      result = await xpgcontrol.CancelRound(inputdata);
      break;
    case "ProcessDebit":
      result = await xpgcontrol.ProcessDebit(inputdata);
      break;
    case "ProcessCredit":
      result = await xpgcontrol.ProcessCredit(inputdata);
      break;
    case "PerformRefund":
      result = await xpgcontrol.PlayerGetBalance(inputdata);
      break;
    default:
      result = await xpgcontrol.PerformRefund(inputdata);
      break;
  }
  console.timeEnd()
  parentPort.postMessage(result);
  
  async function player_balanceupdatein(id, amount, wallets) {
    var amount = parseFloat(amount);
    var outdata = await playersUser.findOneAndUpdate(
      { id: id },
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );
    if (!outdata) {
      return false;
    } else {
      // var row = Object.assign({},wallets,{updatedbalance : outdata.balance});
      var row = Object.assign({}, wallets, {
        updatedbalance: outdata.balance + outdata.bonusbalance,
      });
      save_wallets_hitory(row, outdata);
      sesssion_update_id(id);
      return outdata.balance + outdata.bonusbalance;
    }
  }
  
  async function sesssion_update_id(id) {
    let times = 1000 * 900;
    let Expires = await firstpagesetting.findOne({
      type: "SessionExpiresSetting",
    });
    if (Expires) {
      times = parseInt(Expires.content.GameSession) * 1000;
    }
  
    var uphandle = await gamesessionmodel.findOneAndUpdate(
      { id: id },
      { intimestamp: new Date(new Date().valueOf() + times) }
    );
    if (uphandle) {
      uphandle = await session_model.findOneAndUpdate(
        { email: uphandle.email },
        { inittime: new Date(new Date().valueOf() + times) }
      );
      if (uphandle) {
        return true;
      } else {
        return false;
      }
    }
  }
  
  async function save_wallets_hitory(rows, outdata) {
    if (rows.debited == 0 && rows.credited == 0) {
    } else {
    //   let outdata = await playersUser.findOne({ id: rows.userid });
      let bonus = getPlayerBonusBalanceCorrect(outdata);
      let row = Object.assign({}, rows, {
        lastBonusBalance: bonus,
        updateBonusBalance: bonus,
      });
  
      await data_save(row, wallethistory_model);
    }
    return true;
  }
  
  function getPlayerBonusBalanceCorrect(item) {
    if (item.balance < 0) {
      return parseInt(item.bonusbalance + item.balance);
    } else {
      return parseInt(item.bonusbalance);
    }
  }
  
  async function data_save(indata, model) {
    var handle = null;
    var savehandle = new model(indata);
    await savehandle.save().then((rdata) => {
      if (!rdata) {
        handle = false;
      } else {
        handle = rdata;
      }
    });
    return handle;
  }
  
  async function sesssion_update_username(username) {
    let times = 1000 * 900;
    let Expires = await firstpagesetting.findOne({
      type: "SessionExpiresSetting",
    });
    if (Expires) {
      times = parseInt(Expires.content.GameSession) * 1000;
    }
    var uphandle = await gamesessionmodel.findOneAndUpdate(
      { username: username },
      { intimestamp: new Date(new Date().valueOf() + times) }
    );
    if (uphandle) {
      uphandle = await session_model.findOneAndUpdate(
        { email: uphandle.email },
        { inittime: new Date(new Date().valueOf() + times) }
      );
      if (uphandle) {
        return true;
      } else {
        return false;
      }
    }
  }
  
  async function playerFindByusername(username) {
    // await this.playerFindbyUseNameUpdate(username)
  
    let item = await playersUser.findOne({ username: username });
    if (item) {
      let row = Object.assign({}, item._doc);
      row["balance"] = row.balance + row.bonusbalance;
      row["lastbalance"] = row.balance;
      return row;
    } else {
      return false;
    }
  }
  
  async function BfindOne(model, condition = {}) {
    var outdata = null;
    await model.findOne(condition).then((rdata) => {
      if (!rdata) {
        outdata = false;
      } else {
        outdata = rdata;
      }
    });
    return outdata;
  }
  
  async function get_gameid(Launchurl, gameid) {
    var item = await BfindOne(Gamelist, { LAUNCHURL: Launchurl, ID: gameid });
    if (item) {
      return { gameid: item._id, providerid: item.providerid };
    } else {
      return false;
    }
  }
  
  async function Bfind(model, condition = {}) {
    var findhandle = null;
    await model.find(condition).then((rdata) => {
      findhandle = rdata;
    });
    if (!findhandle) {
      return false;
    } else {
      return findhandle;
    }
  }
});
