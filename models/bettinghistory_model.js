const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const basecontroller = require("../controller/basecontroller")


const BettingHistory_model =()=>{
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
        commission : {
            type : Number,
            default : 0
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
    return mongoose.model( "Betting_history", UserSchema)
}


const binaryBettingHistory_model =()=>{
    var  UserSchema = new Schema({
        
        userid : {
            type: Schema.Types.ObjectId, ref: 'user_users',
        },      
        AMOUNT : {
            type : Number,
            required : true
        },
        commission : {
            type : Number,
            default : 0
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
    return mongoose.model( "binaryBetting_history", UserSchema)
}

module.exports ={
    BettingHistory_model : BettingHistory_model(),
    binaryBettingHistory_model : binaryBettingHistory_model(),
}
