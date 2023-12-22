const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var  UserSchema = new Schema({
    TYPE: {
        type: String,
        default : ''
    },
    ID : {
        type : String,
        default : ''
    },
    NAME : {
        type : String,
        default : ''
    },    
    status : {
        type : Boolean,
        default : false
    },
   
    // fpstatus : {
    //     type : Boolean,
    //     default : false
    // },
    providerid : {
        type: Schema.Types.ObjectId, ref: 'game_gameprovider',
    },
    PROVIDERID :{
        type : String,
        default : ""
    },
    WITHOUT : {
        type:Object,
        default :{
            maxbet : 0,
            minbet : 0
        }
    },
    LAUNCHURL : {
        type : String,
        required : true
    },
    image : {
        type : String,
        default : ""
    },
    order :{
        type : Number,
        required : true
    }
});

module.exports = UserSchema;
