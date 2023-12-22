const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var  UserSchema = new Schema({
       
       
    inittime : {
        required: true,
        type: Date,
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    id: {
        type: Schema.Types.ObjectId, ref: 'user_users',
    },
    ip: {
        type: String,
    },
    socketuser: {
        type: Schema.Types.ObjectId, ref: 'user_socket',
    },
});

module.exports = UserSchema;
