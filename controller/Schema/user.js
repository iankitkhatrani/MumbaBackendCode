const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const basecontroller = require("../basecontroller")
const bcrypt = require('bcrypt');

var  UserSchema = new Schema({
    fakeid : { type : Number },  
    date: { type: Date,  },
    updatedAt: { type: Date,  },
    email : { type : String, required : true,unique: true,},
    username: { type: String, unique: true, required: [true, "username is required"] },
    password: {
        type: String,
        unique: false,
        validate: {
          validator: function (v) {
            return /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/.test(v);
          },
          message: props => `${props.value} is not a valid password`
        },
        required: [true, "password is required"]
      },
    firstname : { type : String,  required : true },
    lastname : { type : String,  required : true },
    permission :{ type : String, required : true },
    status : { type : String, required : true },    
    created : {type : String, required : true },
    positiontaking : {type :Number,default : 0},
    signup_device : { type : String, },
    botdevice : { type : String, },
    isdelete : { type : Boolean, default : false },

    currency : { type : String, default : "INR" },
    country_name : { type : String, default : "" },
    region_name : { type : String, default : "" },
    birth_region_code : { type : String, default : ""},
    birth_region_id : {type : String, default : "" },
    birth_department : {type : String, default : "" },
    birth_city : {type : String, default : "" },
    time_zone : { type : String, default : "" },
    city_name : { type : String, default : "" },
    country_code : { type : String, default : "" },
    zip_code  : {type : String, default : "" },
    area_code : { type : String, default : "" },
    ip : { type : String, default : "" },
    contact : { type : String, default : "" },
    address : { type : String, default : "" },
    mobilenumber :{ type : String,default :""},
    avatar : { type : String, default: ""},
    accountholder : { type : String, default : "" },
    cashdesk : { type : String, default : ""},
    language : { type : String, default : "" },
    middlename : { type : String, default : "" },
    phone : { type : String, default : "" },
    personal_id : {type : String, default : "" },
    affiliate_id : {type : String, default : "" },
    btag : {type : String, default : "" },
    external_id : {type : String, default : "" },
    balance : {type : String, default : "" },
    document_issue_code : {type : String, default : "" },
    document_issuedby : {type : String, default : "" },
    document_number : {type : String, default : "" },
    iban : {type : String, default : "" },
    is_logged_in : {type : String, default : "" },
    profile_id : {type : String, default : "" },
    promo_code : {type : String, default : "" },
    province : {type : String, default : "" },
    registration_source : {type : String, default : "" },
    client_category : {type : String, default : "" },
    swiftcode : {type : String, default : "" },
    bank_name : {type : String, default : "" },
    state : {type : String, default : "" },
    last_login_ip : {type : String, default : "" },
    sport_last_bet : {type : String, default : "" },
    gaming_last_bet : {type : String, default : "" },
    custome_player_category : {type : String, default : "" },
    wrong_login_attempts : {type : String, default : "" },
    pep_status : {type : String, default : "" },
    gender : { type : String, default : ""},
    
    last_login_date : {type : String, default : "" },
    first_deposit_date : {type : String, default : "" },
    document_issue_date : {type : Date, default : "" },
    wrong_login_block_time : {type : Date, default : "" },
    birthday : { type : Date, default : "" },
    
    test : { type : Boolean, default : false },
    is_verified : {type : Boolean, default : false },
    subscribedtosms : {type : Boolean,default : false},
    subscribedtoemail : {type : Boolean,default : false},
    subscribed_to_newsletter : {type : Boolean, default : false },
    subscribed_to_phone_call : {type : Boolean, default : false },
    subscripted_internal_message : {type : Boolean, default : false },
    subscribed_to_push_notifications : {type : Boolean, default : false },
    usingloyaltyprogram : { type : Boolean, default : false },

    idverify : {type : Boolean,default : false},
    resident : { type : Boolean, default : false },
    emailverify : { type : Boolean, default : false },
    playerid : { type: Schema.Types.ObjectId, ref: 'user_players' },
    permissionid : { type: Schema.Types.ObjectId, ref: 'user_role' },
});

UserSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}
  
UserSchema.methods.validPassword = function (password, encrypted) {
    return bcrypt.compareSync(password, encrypted);
}


UserSchema.pre('save', function() {
    this.set({ fakeid: get_max_id() });
    this.set({ date: basecontroller.Indiatime() });
});

UserSchema.pre('find', function () {
    // `this` is an instance of mongoose.Query
    this.populate('playerid',["balance","bonusbalance","sattalimit","exchangelimit","sportsbooklimit","betdelaytime"]).populate('permissionid',["title","id","pid"]);
    this.select(["username","email","password",
        "lastname",
        "firstname",
        "status",
        "created",
        "positiontaking",
        "signup_device",
        "isdelete",
        "gender",
        "mobilenumber","permission","avatar","fakeid","date","address","botdevice",'language'
    ]);
});


UserSchema.pre('findOne', function () {
    // `this` is an instance of mongoose.Query
    this.populate('playerid',["balance","bonusbalance","sattalimit","exchangelimit","sportsbooklimit","betdelaytime"]).populate('permissionid',["title","id","pid"]);
    this.select(["username","email","password",
        "lastname",
        "firstname",
        "status",
        "created",
        "positiontaking",
        "signup_device",
        "isdelete",
        "gender",
        "mobilenumber","permission","avatar","fakeid","date","address","botdevice","language"
    ]);
});

UserSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: basecontroller.Indiatime()});
});
UserSchema.pre('updateOne', function() {
    this.set({ updatedAt: basecontroller.Indiatime() });
});

module.exports = UserSchema;
