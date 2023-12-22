const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var  FPpagesettingSchema = new Schema({
    type: {
        type: String,
        default : ""
    },
    content: {
        type: Object,
    }
});

module.exports = FPpagesettingSchema;
