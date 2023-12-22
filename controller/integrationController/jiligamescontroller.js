const LAUNCHURL = "14";
var mongoose = require("mongoose");

const BASECONTROL = require("./../basecontroller");
const gamesessionModel = require("../../models/users_model").gamesessionmodel;
const betting_historymodel =
  require("../../models/bettinghistory_model").BettingHistory_model;
const playerModel = require("../../models/users_model").GamePlay;
const conf = require("../../servers/home.json")

async function player_balanceupdatein(amount, uid, wallets) {
  var outdata = await BASECONTROL.player_balanceupdatein_Id(
    amount,
    uid,
    wallets
  );
  return outdata;
}

exports.auth = async (req, res, next) => {
  const { token, reqId } = req.body;
  console.log(req.body);

  var ses = await BASECONTROL.BfindOne(gamesessionModel, { token: token });
  if (!ses) {
    res.send({
      errorCode: 4,
      message: "Token expired",
      token: token,
    });
  } else {
    var user = await BASECONTROL.PlayerFindByemail(ses.email);
    if (!user) {
      res.send({
        errorCode: 4,
        message: "Token expired",
        token: token,
      });
    } else {
      console.log(user, "--user");
      res.send({
        errorCode: 0,
        message: "success",
        username: user.username + conf.prefix,
        currency: "INR",
        balance: user.balance,
        token: token,
      });
    }
  }

  return next();
};

exports.bet = async (req, res, next) => {
  var reqp = {
    reqId: "9177b749-cf37-585b-b17c-cfd5024ca6e2",
    token: "6f6d63331c1173c8367e43b5fe6c49dd",
    currency: "USD",
    game: 1,
    round: 1723805050100110202,
    betAmount: 10,
    winloseAmount: 5,
  };
  var resp = {
    errorCode: 0,
    message: "success",
    username: "testUser",
    currency: "USD",
    balance: 995,
    txId: 108430126,
    token: "6f6d63331c1173c8367e43b5fe6c49dd",
  };

  var reqp1 = {
    reqId: "9177b749-cf37-585b-b17c-cfd5024ca6e2",
    token: "6f6d63331c1173c8367e43b5fe6c49dd",
    currency: "USD",
    game: 9,
    round: 17238050501001102002,
    wagersTime: 1592559162073,
    betAmount: 0,
    winloseAmount: 55,
    userId: "3368799_2679638",
    isFreeRound: true,
  };
  console.log(req.body, "--req.body--- bet");
  let rdata = await debit_child(req.body);
  rdata["currency"] = req.body.currency;
  rdata["balance"] = Number(rdata.balance.toFixed(2));
  rdata["txId"] = new Date().valueOf();
  rdata["username"] = rdata.username + conf.prefix;
  
  console.log(rdata, "--rdata--rdata");

  res.send(rdata);
  return next();
};

async function get_play(uid) {
  var user = await BASECONTROL.playerFindByid(uid);
  return user;
}
async function debit_child(indata) {
  var debitAmount = Number(indata.betAmount);
  var winloseAmount = Number(indata.winloseAmount);
  var sess_bool = null;
  var uid = "";
  if (indata.isFreeRound) {
    let username = indata.userId.split(conf.prefix) 
    sess_bool = await BASECONTROL.BfindOne(playerModel, {
      username,
    });
    uid = sess_bool.userid;
  } else {
    sess_bool = await BASECONTROL.BfindOne(gamesessionModel, {
      token: indata.token,
    });
    uid = sess_bool.id;
  }
  if (!sess_bool) {
    return { errorCode: 4, message: "Token expired", balance: 0, username: "" };
  } else {
    var user = await get_play(uid);
    if (!user) {
      return { errorCode: 5, message: "Other error", balance: 0, username: "" };
    } else {
      let ip = sess_bool.ipaddress;
      var lastdebit = await BASECONTROL.BfindOne(betting_historymodel, {
        LAUNCHURL: LAUNCHURL,
        TYPE: "BET",
        "betting.round": indata.round,
      });
      if (!lastdebit) {
        if (Number(user.balance.toFixed(2)) < debitAmount) {
          return {
            errorCode: 2,
            message: "Not enough balance ",
            balance: user.balance,
            username: user.username,
          };
        } else {
          var gameId = await BASECONTROL.get_gameid(LAUNCHURL, indata.game);
          if (!gameId) {
            return {
              errorCode: 5,
              message: "Other error",
              balance: user.balance,
              username: user.username,
            };
          }

          var row = {
            AMOUNT: debitAmount,
            LAUNCHURL: LAUNCHURL,
            TYPE: "BET",
            userid: mongoose.Types.ObjectId(user.id),
            transactionId: indata.round,
            roundId: indata.round,
            betting: {
              prevbalance: user.balance,
              round: indata.round,
            },
            gameid: mongoose.Types.ObjectId(gameId.gameid),
            providerid: mongoose.Types.ObjectId(gameId.providerid),
            ipaddress: ip,
          };

          var wallets_ = {
            commission: 0,
            gameid: mongoose.Types.ObjectId(gameId.gameid),
            status: "BET",
            userid: mongoose.Types.ObjectId(user.id),
            roundid: indata.round,
            transactionid: indata.round,
            lastbalance: user.balance,
            credited: 0,
            debited: debitAmount,
            ipaddress: ip,
          };

          var savehandle = await BASECONTROL.data_save(
            row,
            betting_historymodel
          );
          if (!savehandle) {
            return {
              errorCode: 5,
              balance: user.balance,
              username: user.username,
              message: "Other error",
            };
          } else {
            var updatehandle = await player_balanceupdatein(
              debitAmount * -1,
              uid,
              wallets_
            );
            if (updatehandle === false) {
              return {
                errorCode: 5,
                balance: user.balance,
                username: user.username,
                message: "Other error",
              };
            } else {
              if (winloseAmount > 0) {
                let {realamount, commamount} = await BASECONTROL.getWinningComission(winloseAmount)
                var row = {
                  AMOUNT: realamount,
                  LAUNCHURL: LAUNCHURL,
                  TYPE: "WIN",
                  userid: mongoose.Types.ObjectId(user.id),
                  transactionId: indata.round,
                  roundId: indata.round,
                  betting: {
                    prevbalance: updatehandle,
                    round: indata.round,
                  },
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  providerid: mongoose.Types.ObjectId(gameId.providerid),
                  ipaddress: ip,
                  commission: commamount,
                };

                var wallets_ = {
                  commission: commamount,
                  gameid: mongoose.Types.ObjectId(gameId.gameid),
                  status: "WIN",
                  userid: mongoose.Types.ObjectId(user.id),
                  roundid: indata.round,
                  transactionid: indata.round,
                  lastbalance: updatehandle,
                  credited: realamount,
                  debited: 0,
                  ipaddress: ip,
                };

                var savehandle = await BASECONTROL.data_save(
                  row,
                  betting_historymodel
                );
                if (!savehandle) {
                  return {
                    errorCode: 5,
                    balance: updatehandle,
                    username: user.username,
                    message: "Other error",
                  };
                } else {
                  var updatehandle = await player_balanceupdatein(
                    realamount,
                    uid,
                    wallets_
                  );
                  if (updatehandle === false) {
                    return {
                      errorCode: 5,
                      balance: updatehandle,
                      username: user.username,
                      message: "Other error",
                    };
                  } else {
                    return {
                      errorCode: 0,
                      balance: updatehandle,
                      username: user.username,
                      message: "success",
                    };
                  }
                }
              } else {
                return {
                  errorCode: 0,
                  balance: updatehandle,
                  username: user.username,
                  message: "success",
                };
              }
            }
          }
        }
      } else {
        return {
          errorCode: 1,
          message: "Already accepted ",
          balance: user.balance,
          username: user.username,
        };
      }
    }
  }
}

async function cancel_child(indata) {
  var debitAmount = Number(indata.betAmount);
  var winloseAmount = Number(indata.winloseAmount);
  let username = indata.userId.split(conf.prefix) 
  var sess_bool = await BASECONTROL.BfindOne(playerModel, {
    username
  });
  if (!sess_bool) {
    return { errorCode: 4, message: "Token expired", balance: 0, username: "" };
  } else {
    var uid = sess_bool.id;
    var user = await get_play(uid);
    if (!user) {
      return { errorCode: 5, message: "Other error", balance: 0, username: "" };
    } else {
      let ip = sess_bool.ipaddress;
      var lastdebit = await BASECONTROL.BfindOne(betting_historymodel, {
        LAUNCHURL: LAUNCHURL,
        TYPE: "CANCELED_BET",
        "betting.round": indata.round,
      });
      if (!lastdebit) {
        var gameId = await BASECONTROL.get_gameid(LAUNCHURL, indata.game);
        if (!gameId) {
          return {
            errorCode: 5,
            message: "Other error",
            balance: user.balance,
            username: user.username,
          };
        }

        var row = {
          AMOUNT: debitAmount,
          LAUNCHURL: LAUNCHURL,
          TYPE: "CANCELED_BET",
          userid: mongoose.Types.ObjectId(user.id),
          transactionId: indata.round,
          roundId: indata.round,
          betting: {
            prevbalance: user.balance,
            round: indata.round,
          },
          gameid: mongoose.Types.ObjectId(gameId.gameid),
          providerid: mongoose.Types.ObjectId(gameId.providerid),
          ipaddress: ip,
        };

        var wallets_ = {
          commission: 0,
          gameid: mongoose.Types.ObjectId(gameId.gameid),
          status: "CANCELED_BET",
          userid: mongoose.Types.ObjectId(user.id),
          roundid: indata.round,
          transactionid: indata.round,
          lastbalance: user.balance,
          credited: 0,
          debited: debitAmount,
          ipaddress: ip,
        };

        var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
        if (!savehandle) {
          return {
            errorCode: 5,
            balance: user.balance,
            username: user.username,
            message: "Other error",
          };
        } else {
          var updatehandle = await player_balanceupdatein(
            debitAmount,
            uid,
            wallets_
          );
          if (updatehandle === false) {
            return {
              errorCode: 5,
              balance: user.balance,
              username: user.username,
              message: "Other error",
            };
          } else {
            if (winloseAmount > 0) {
              var row = {
                AMOUNT: winloseAmount,
                LAUNCHURL: LAUNCHURL,
                TYPE: "CANCELED_BET",
                userid: mongoose.Types.ObjectId(user.id),
                transactionId: indata.round,
                roundId: indata.round,
                betting: {
                  prevbalance: updatehandle,
                  round: indata.round,
                },
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                providerid: mongoose.Types.ObjectId(gameId.providerid),
                ipaddress: ip,
              };

              var wallets_ = {
                commission: 0,
                gameid: mongoose.Types.ObjectId(gameId.gameid),
                status: "CANCELED_BET",
                userid: mongoose.Types.ObjectId(user.id),
                roundid: indata.round,
                transactionid: indata.round,
                lastbalance: updatehandle,
                credited: 0,
                debited: winloseAmount,
                ipaddress: ip,
              };

              var savehandle = await BASECONTROL.data_save(
                row,
                betting_historymodel
              );
              if (!savehandle) {
                return {
                  errorCode: 5,
                  balance: updatehandle,
                  username: user.username,
                  message: "Other error",
                };
              } else {
                var updatehandle = await player_balanceupdatein(
                  winloseAmount * -1,
                  uid,
                  wallets_
                );
                if (updatehandle === false) {
                  return {
                    errorCode: 5,
                    balance: updatehandle,
                    username: user.username,
                    message: "Other error",
                  };
                } else {
                  return {
                    errorCode: 0,
                    balance: updatehandle,
                    username: user.username,
                    message: "success",
                  };
                }
              }
            } else {
              return {
                errorCode: 0,
                balance: updatehandle,
                username: user.username,
                message: "success",
              };
            }
          }
        }
      } else {
        return {
          errorCode: 1,
          message: "Already accepted ",
          balance: user.balance,
          username: user.username,
        };
      }
    }
  }
}

exports.cancelbet = async (req, res, next) => {
  var reqp = {
    reqId: "9177b749-cf37-585b-b17c-cfd5024ca6e2",
    currency: "USD",
    game: 1,
    round: 1723805050100110202,
    betAmount: 10,
    winloseAmount: 5,
  };
  var resp = {
    errorCode: 0,
    message: "success",
    username: "testUser",
    currency: "USD",
    balance: 1000,
    txId: 108430126,
  };
  console.log(req.body, "--req.body--- cancel bet");
  let rdata = await cancel_child(req.body);

  rdata["currency"] = req.body.currency;
  rdata["balance"] = Number(rdata.balance.toFixed(2));
  rdata["txId"] = new Date().valueOf();
  rdata["username"] = rdata.username + conf.prefix;

  res.send(rdata);
  return next();
};
