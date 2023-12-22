const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const basecontroller = require("../basecontroller")

var  UserSchema = new Schema({
    // GAMEID : {
    //     type : String,
    //     required : true,
    // },
    // USERID : {
    //     type : String,
    //     required : true  
    // },
    LAUNCHURL : {
        type : String,
        required : true
    },
    gameid : {
        type: Schema.Types.ObjectId, ref: 'game_game_list',
    },  
    providerid : {
        type: Schema.Types.ObjectId, ref: 'game_gameprovider',
    },  
    userid : {
        type: Schema.Types.ObjectId, ref: 'user_users',
    },      
    AMOUNT : {
        type : Number,
        required : true
    },
    betting : {
        type :Object,
        required : true
    },
    TYPE : {
        type : String,
        required : true
    },
    DATE: {
        type: Date,
    },
    transactionId : {
        type : String,
    },
    roundId : {
        type : String,
    },
    ipaddress :{
        type : String,
    },
});


UserSchema.pre('save', function() {
    this.set({ DATE: basecontroller.Indiatime() });
});

module.exports = UserSchema;
