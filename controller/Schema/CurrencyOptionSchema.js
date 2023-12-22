const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var  UserSchema = new Schema({
    label : {
        type : String,
        require : true
    },
    code : {
        type : String,
        require : true
    },
    active : {
        type : Boolean,
        default : false
    },
    rate : {
        type : Number,
        require : true
    }
});


module.exports = UserSchema;
