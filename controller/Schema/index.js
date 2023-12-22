const mongoose = require("mongoose");
const DB = require("../../servers/db.json");
const firstSchema = require("../Schema/firstpagesetting")
const walletSchema = require("../Schema/wallethistory")
const gamesessionSchema = require("../Schema/gamesession")
const PlayerSchema = require("../Schema/player")
const UsersesSchema = require("../Schema/usersession")
const BetHisSchema = require("../Schema/BetHisSchema")
const GamelistSchema = require("../Schema/GamelistSchema")
const CurrencyOptionSchema = require("../Schema/CurrencyOptionSchema")

const conn = mongoose.createConnection(DB.DBCONNECT, { useNewUrlParser: true ,useFindAndModify: false,useUnifiedTopology: true,useCreateIndex : true});
const firstpagesetting = conn.model('tbl_firstpagesetting', firstSchema);
const wallethistory_model = conn.model('user_wallethistory', walletSchema);
const gamesessionmodel = conn.model('user_gamesession', gamesessionSchema);
// const UserModel = conn.model('User', UserSchema);
const playersUser = conn.model('user_players', PlayerSchema);
const session_model = conn.model('user_session', UsersesSchema);
const betting_historymodel = conn.model('Betting_history', BetHisSchema);
const Gamelist = conn.model('game_game_list', GamelistSchema);
const CurrencyOptions = conn.model('currencyoptions', CurrencyOptionSchema);

module.exports = {
    firstpagesetting,
    wallethistory_model,
    gamesessionmodel,
    playersUser,
    session_model,
    betting_historymodel,
    Gamelist,
    CurrencyOptions
}