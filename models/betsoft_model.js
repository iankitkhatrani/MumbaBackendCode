const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BaseCon = require("../controller/basecontroller")
const nowdate = BaseCon.get_date();

const betsoft_bonuswinmodel = (dt = nowdate) =>{
    var  UserSchema = new Schema({
        amount : {
            type : Number,
            default : 0        
        },
        bonusId : {
            type : String,
            default : ''
        },
        userId : {
            type : String,
            default : ''
        },
        transactionId : {
            type : String,
            default : ''
        },
        hash :{
            type : String,
            default : ''
        },
        date: {
            type: Date,
            default: Date.now
        },
        type : {
            type : String,
            required : true
        }
    });
    return mongoose.model(dt+'betsoft_bonuswinmodel', UserSchema)
}

const betsoft_transbetmodel = (dt = nowdate) =>{
    var  UserSchema = new Schema({
        gameId : {
            type : String,
            default : ""
        },
        gameSessionId : {
            type : String,
            default : ""
        },
        userId : {
            type : String,
            default : ''
        },
        roundId : {
            type : String,
            default : ''
        },
        hash :{
            type : String,
            default : ''    
        },
        casinoTransactionId : {
            type : String,
            default : ""
        },
        amount : {
            type : Number,
            default : 0
        },
        transactionId : {
            type :String,
            default : ""
        },
        date: {
            type: Date,
            default: Date.now
        },
        extSystemTransactionId : {
            type : String,
            default : ""        
        },
        type :{
            type:String,
            required : true
        }
    });
    return mongoose.model(dt+'betsoft_transbetmodel', UserSchema)
}

module.exports  = {
    betsoft_bonuswinmodel : betsoft_bonuswinmodel(),
    betsoft_transbetmodel : betsoft_transbetmodel(),
}