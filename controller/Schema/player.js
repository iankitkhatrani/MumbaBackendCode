const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var  PlayerSchema = new Schema({
    username: {
        type: String,
        required : true,unique:true
    },
    id: {
        type: String,
        required : true,
        unique:true,
    },
    userid: {
        type: Schema.Types.ObjectId, ref: 'user_users'
    },
    email: {
        type: String,
        required : true,unique:true
    },
    balance : {
        type : Number,
        default : 0
    },
    sattalimit : {
        type : Number,
        default : 0
    },
    sportsbooklimit : {
        type : Number,
        default : 0
    },
    exchangelimit : {
        type : Number,
        default : 0
    },
    betdelaytime: {
        type : Number,
        default : 7
    },
    firstname : {
        type: String,
        required : true
    },
    lastname : {
        type: String,
        required : true
    },
    pid : {
        type : Number,
    },
    bonusbalance : {
        type : Number,
        default : 0
    },
});

PlayerSchema.pre('save', function() {
    this.set({ pid: get_max_id(), betdelaytime: 7 });
});


function get_max_id (){
    var a = new Date().valueOf() + "";
    var b=  a.slice((a.length-1-7),(a.length-1));
    return b;
}

module.exports = PlayerSchema;
