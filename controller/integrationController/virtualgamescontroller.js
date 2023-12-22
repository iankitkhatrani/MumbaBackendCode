const BASECONTROL = require("./../basecontroller");
const gamesessionModel = require("../../models/users_model").gamesessionmodel;
const betting_historymodel =
  require("../../models/bettinghistory_model").BettingHistory_model;
var mongoose = require("mongoose");
const LAUNCHURL = "16";
const playerModel = require("../../models/users_model").GamePlay;

async function player_balanceupdatein(amount, userId, wallets) {
  var outdata = await BASECONTROL.player_balanceupdatein_Id(
    amount,
    userId,
    wallets
  );
  return outdata.toFixed(2);
}

exports.debit = async (req, res, next) => {
  //   {
  //     "partnerKey": "6yhUl8mtfTZQcyhfIY22nXVRVHGKz21G2sBXfUmDv+nPy9S5N9n5MEy9honjNzP/xFQ+f0mc5WY=",
  //     "user": {
  //         "id": "kt11",
  //         "currency": "INR"
  //     },
  //     "gameData": {
  //         "providerCode": "SN",
  //         "providerTransactionId": "25406",
  //         "gameCode": "VTP",
  //         "description": "bet",
  //         "providerRoundId": "2449691"
  //     },
  //     "transactionData": {
  //         "Id": "249",
  //         "amount": 500.00,
  //         "referenceId": ""
  //     },
  //     "timestamp": "1628764434278"
  // }

  let result = await debit_child(req.body);
  if (result.status) {
    res.send({
      partnerKey: req.body.partnerKey,
      timestamp: new Date().valueOf(),
      userId: result.userId,
      balance: result.balance,
      status: {
        code: "SUCCESS",
        message: "",
      },
    });
  } else {
    res.send({
      partnerKey: null,
      timestamp: null,
      userId: null,
      balance: 0,
      status: {
        code: "INVALID_TOKEN",
        message: "sessionId is invalid.",
      },
    });
  }
};

exports.credit = async (req, res, next) => {
  //   {
  //     "partnerKey": "6yhUl8mtfTZQcyhfIY22nXVRVHGKz21G2sBXfUmDv+nPy9S5N9n5MEy9honjNzP/xFQ+XXXXXXX=",
  //     "user": {
  //         "id": "XX",
  //         "currency": "INR"
  //     },
  //     "gameData": {
  //         "providerCode": "SN",
  //         "providerTransactionId": "250",
  //         "gameCode": "VTP",
  //         "description": "win",
  //         "providerRoundId": "2449691"
  //     },
  //     "transactionData": {
  //         "id": "250",
  //         "amount": 715.00,
  //         "referenceId": ""
  //     },
  //     "timestamp": "1628764919503"
  // }
  let result = await win_child(req.body);
  if (result.status) {
    res.send({
      partnerKey: req.body.partnerKey,
      timestamp: new Date().valueOf(),
      userId: result.userId,
      balance: result.balance,
      status: {
        code: "SUCCESS",
        message: "",
      },
    });
  } else {
    res.send({
      partnerKey: null,
      timestamp: null,
      userId: null,
      balance: 0,
      status: {
        code: "INVALID_TOKEN",
        message: "sessionId is invalid.",
      },
    });
  }
};

exports.getbalance = async (req, res, next) => {
  console.log("--getbalance--");
  // /virtualgames/getbalance
  // 2|kasagames  | {
  // 2|kasagames  |   partnerKey: '8xToyVhisxwAqIUjsFGbKJ5X+3VUaUnpIOngT2Qch72UD1HWK+BOG5g8pxfL3mjS/K9KovLe8mU=',
  // 2|kasagames  |   userId: '123456789',
  // 2|kasagames  |   timestamp: '1633791537697'
  // 2|kasagames  | }
  // 2|kasagames  | 81
  let { partnerKey, userId, timestamp } = req.body;
  // let token = userId.split(":")[0];
  let accountid = userId;

  let plin = await BASECONTROL.playerFindByid(accountid);
  if (plin) {
    res.send({
      partnerKey,
      timestamp: new Date().valueOf(),
      userId: accountid,
      balance: plin.balance.toFixed(2),
      status: {
        code: "SUCCESS",
        message: "",
      },
    });
    return next();
  } else {
    res.send({
      partnerKey: null,
      timestamp: null,
      userId: null,
      balance: 0,
      status: {
        code: "INVALID_TOKEN",
        message: "Token has expired or invalid",
      },
    });
    return next();
  }
};

async function debit_child(indata) {
  console.log(indata, "--indata---");
  var debitAmount = indata.transactionData.amount;
  var transactionId = indata.gameData.providerTransactionId;
  var roundId = indata.gameData.providerRoundId;
  var gameId = indata.gameData.gameCode;
  var description = indata.gameData.description;
  let playerpid = indata.user.id;

  console.log("----processs 1");

  var sess_bool = await BASECONTROL.BfindOne(playerModel, {
    userid: playerpid,
  });
  if (!sess_bool) {
    console.log("----processs 2");

    return { status: false };
  } else {
    var uid = sess_bool.userid;
    var user = await BASECONTROL.playerFindByid(uid);
    if (!user) {
      console.log("----processs 3");
      return { status: false };
    } else {
      let ip = sess_bool.ipaddress;
      let bettype = "";
      if (description == "bet") {
        bettype = "BET";
      } else if (description == "cancel") {
        bettype = "CANCELED_BET";
      }
      var lastdebit = await BASECONTROL.BfindOne(betting_historymodel, {
        LAUNCHURL: LAUNCHURL,
        TYPE: bettype,
        "betting.txnId": transactionId,
      });
      console.log(lastdebit, "--lastdebit---");
      if (!lastdebit) {
        console.log("----processs 4");
        if (Number(user.balance.toFixed(2)) < debitAmount) {
          return {
            status: false,
            balance: user.balance,
            userId: user.userid,
          };
        } else {
          var gameId = await BASECONTROL.get_gameid(LAUNCHURL, gameId);

          var row = {
            AMOUNT: debitAmount,
            LAUNCHURL: LAUNCHURL,
            TYPE: bettype,
            userid: mongoose.Types.ObjectId(user.userid),
            transactionId: transactionId,
            roundId: roundId,
            betting: {
              prevbalance: user.balance,
              txnId: transactionId,
            },
            gameid: mongoose.Types.ObjectId(gameId.gameid),
            providerid: mongoose.Types.ObjectId(gameId.providerid),
            ipaddress: ip,
          };
          var wallets_ = null;
          if (bettype == "BET") {
            wallets_ = {
              commission: 0,
              gameid: mongoose.Types.ObjectId(gameId.gameid),
              status: bettype,
              userid: mongoose.Types.ObjectId(user.userid),
              roundid: transactionId,
              transactionid: roundId,
              lastbalance: user.balance,
              credited: 0,
              debited: debitAmount,
              ipaddress: ip,
            };
            debitAmount = debitAmount * -1;
          } else {
            wallets_ = {
              commission: 0,
              gameid: mongoose.Types.ObjectId(gameId.gameid),
              status: bettype,
              userid: mongoose.Types.ObjectId(user.userid),
              roundid: transactionId,
              transactionid: roundId,
              lastbalance: user.balance,
              credited: debitAmount,
              debited: 0,
              ipaddress: ip,
            };
            // debitAmount = debitAmount;
          }

          var savehandle = await BASECONTROL.data_save(
            row,
            betting_historymodel
          );
          if (!savehandle) {
            console.log("----processs 6");
            return {
              status: false,
              balance: user.balance,
              userId: user.userid,
            };
          } else {
            var updatehandle = await player_balanceupdatein(
              debitAmount,
              uid,
              wallets_
            );
            if (updatehandle === false) {
              console.log("----processs 7");

              return {
                status: false,
                balance: user.balance,
                userId: user.userid,
              };
            } else {
              console.log("----processs 8");

              return {
                status: true,
                balance: updatehandle,
                username: user.username,
                userId: user.userid,
              };
            }
          }
        }
      } else {
        console.log("----processs 9");
        return {
          status: true,
          userId: user.userid,
          balance: user.balance,
        };
      }
    }
  }
}

async function win_child(indata) {
  console.log(indata, "--indata---");

  var debitAmount = indata.transactionData.amount;
  var gameId = indata.gameData.gameCode;
  let playerpid = indata.user.id;
  var transactionId = indata.gameData.providerTransactionId;
  var roundId = indata.gameData.providerRoundId;
  var description = indata.gameData.description;

  var sess_bool = await BASECONTROL.BfindOne(playerModel, {
    userid: playerpid,
  });
  if (!sess_bool) {
    console.log("----processs 1");
    return { status: false };
  } else {
    console.log("----processs 2");
    var uid = sess_bool.userid;
    var user = await BASECONTROL.playerFindByid(uid);
    if (!user) {
      console.log("----processs 3");
      return { status: false };
    } else {
      let bettype = "";
      if (description == "win") {
        bettype = "WIN";
      } else if (description == "cancel") {
        bettype = "CANCELED_WIN";
      }

      let ip = sess_bool.ipaddress;
      var lastdebit = await BASECONTROL.BfindOne(betting_historymodel, {
        LAUNCHURL: LAUNCHURL,
        TYPE: bettype,
        "betting.txnId": transactionId,
      });
      if (!lastdebit) {
        console.log("----processs 4");

        var gameId = await BASECONTROL.get_gameid(LAUNCHURL, gameId);
        let {realamount, commamount} = await BASECONTROL.getWinningComission(debitAmount)

        var row = {
          AMOUNT: realamount,
          LAUNCHURL: LAUNCHURL,
          TYPE: "WIN",
          userid: mongoose.Types.ObjectId(user.userid),
          transactionId: transactionId,
          roundId: roundId,
          betting: {
            prevbalance: user.balance,
            txnId: transactionId,
          },
          gameid: mongoose.Types.ObjectId(gameId.gameid),
          providerid: mongoose.Types.ObjectId(gameId.providerid),
          ipaddress: ip,
          commission: commamount,
        };
        var wallets_ = {};
        if (description == "win") {
          wallets_ = {
            commission: commamount,
            gameid: mongoose.Types.ObjectId(gameId.gameid),
            status: "WIN",
            userid: mongoose.Types.ObjectId(user.userid),
            roundid: roundId,
            transactionid: transactionId,
            lastbalance: user.balance,
            credited: realamount,
            debited: 0,
            ipaddress: ip,
          };
        } else {
          wallets_ = {
            commission: commamount,
            gameid: mongoose.Types.ObjectId(gameId.gameid),
            status: "CANCELED_WIN",
            userid: mongoose.Types.ObjectId(user.userid),
            roundid: roundId,
            transactionid: transactionId,
            lastbalance: user.balance,
            credited: 0,
            debited: realamount,
            ipaddress: ip,
          };
          realamount = realamount * -1;
        }

        var savehandle = await BASECONTROL.data_save(row, betting_historymodel);
        if (!savehandle) {
          console.log("----processs 5");
          return {
            status: false,
            balance: user.balance,
            userId: user.userid,
          };
        } else {
          var updatehandle = await player_balanceupdatein(
            realamount,
            uid,
            wallets_
          );
          if (updatehandle === false) {
            console.log("----processs 6");
            return {
              status: false,
              balance: user.balance,
              userId: user.userid,
            };
          } else {
            console.log("----processs 7");

            return {
              status: true,
              balance: updatehandle,
              username: user.username,
              userId: user.userid,
            };
          }
        }
      } else {
        console.log("----processs 8");
        return {
          status: true,
          userId: user.userid,
          balance: user.balance,
        };
      }
    }
  }
}
