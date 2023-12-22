const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var  UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique : true
    },
    username: {
        type: String,
        required: true,
        unique : true
    },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    ipaddress: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        default: "INR"
    },
    date: {
        type: Date,
    },
    token : {
        type :String,
        required : true
    },
    intimestamp : {
        type: Date,
        required: true
    },
    id :{
        type: String,
        required: true,
        unique : true

    },
});

module.exports = UserSchema;
