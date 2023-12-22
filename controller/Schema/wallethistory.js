const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const basecontroller = require("../basecontroller")

var  UserSchema = new Schema({
    roundid : {
        type: String,
        required : true
    },
    transactionid : {
        type: String,
        required : true
    },
    bonus : {
        type :Boolean,
        default :false
    },
    // GAMEID : {
    //     type : String,
    //     required : true,
    // },
    // LAUNCHURL : {
    //     type : String,
    //     required : true,
    // },
    status :{
        type : String,
        required : true,
    },
    lastbalance : {
        type : Number,
        required : true
    },
    gameid : {
        type: Schema.Types.ObjectId, ref: 'game_game_list',
    },
    sportid : {
        type: Schema.Types.ObjectId, ref: 'sports_list',
    },
    sportsData : {
        type: Object,
    },
    exchangedata : {
        type: Object,
    },
    userid : {
        type: Schema.Types.ObjectId, ref: 'user_users',
    },
    paymentid : {
        type: Schema.Types.ObjectId, ref: 'Payment_history',
    },
    bazaarid : {
        type: Schema.Types.ObjectId, ref: 'matka_Bazaar',
    },
    matkabetid : {
        type: Schema.Types.ObjectId, ref: 'matka_betmodels',
    },
    bonushisid : {
        type: Schema.Types.ObjectId, ref: 'promotion_bonushistory',
    },
    
    // USERID : {
    //     type : String,
    //     required : true
    // },
    commission : {
        type : Number,
        required : true
    },
    credited : {
        type : Number,
        required : true,
    },
    debited : {
        type : Number,
        required : true
    },
    updatedbalance : {
        type : Number,
        required : true
    },
    updated : {
        type: Date,
    },
    ipaddress: {
        type : String,
    },
    lastBonusBalance : {
        type : Number,
        required : true
    },
    updateBonusBalance : {
        type : Number,
        required : true
    },
});

UserSchema.pre('save', function() {
    this.set({ updated: basecontroller.Indiatime() });
});
module.exports = UserSchema;
