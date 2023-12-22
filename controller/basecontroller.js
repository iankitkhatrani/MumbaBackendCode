const USERS = require("../models/users_model");
const Gamelist = require("../models/games_model").GAMELISTMODEL;
const playersUser = USERS.GamePlay;
const session_model = USERS.usersessionmodel;
const gamesessionmodel = USERS.gamesessionmodel;
const wallethistory_model = USERS.wallethistory
const { firstpagesetting, CurrencyOptions } = require("../models/firstpage_model");

var moment = require('moment-timezone');

exports.Indiatime = () => {
	var time = moment.tz(new Date(), "Asia/Kolkata");
	time.utc("+530").format();
	return time;
}
exports.get_ipaddress = (req) => {
	var forwarded = req.headers['x-forwarded-for']
	var ips = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
	var ip = ips && ips.length > 0 && ips.indexOf(",") ? ips.split(",")[0] : null;
	return ip;
}

exports.getWinningComission = async (amount) => {
	let comission = 2
	let curen = await firstpagesetting.findOne({ type: "WinningComission" });
	if (curen && curen.content && curen.content.status && curen.content.comission) {
		comission = parseInt(curen.content.comission)
	} else {
		comission = 0
	}
	let commamount = (amount/100 * comission)
	let realamount = amount - commamount
	return {realamount, commamount}
}

exports.getCurrency = async () => {
	let currency = "INR"
	let dd = await CurrencyOptions.findOne({ active: true });
	if (dd) {
		currency = dd.code
	}
	return currency
}

function get_md5string(string) {
	function RotateLeft(lValue, iShiftBits) {
		return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
	}
	function AddUnsigned(lX, lY) {
		var lX4, lY4, lX8, lY8, lResult;
		lX8 = (lX & 0x80000000);
		lY8 = (lY & 0x80000000);
		lX4 = (lX & 0x40000000);
		lY4 = (lY & 0x40000000);
		lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
		if (lX4 & lY4) {
			return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
		}
		if (lX4 | lY4) {
			if (lResult & 0x40000000) {
				return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
			} else {
				return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
			}
		} else {
			return (lResult ^ lX8 ^ lY8);
		}
	}

	function F(x, y, z) { return (x & y) | ((~x) & z); }
	function G(x, y, z) { return (x & z) | (y & (~z)); }
	function H(x, y, z) { return (x ^ y ^ z); }
	function I(x, y, z) { return (y ^ (x | (~z))); }

	function FF(a, b, c, d, x, s, ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};

	function GG(a, b, c, d, x, s, ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};

	function HH(a, b, c, d, x, s, ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};

	function II(a, b, c, d, x, s, ac) {
		a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
		return AddUnsigned(RotateLeft(a, s), b);
	};

	function ConvertToWordArray(string) {
		var lWordCount;
		var lMessageLength = string.length;
		var lNumberOfWords_temp1 = lMessageLength + 8;
		var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
		var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
		var lWordArray = Array(lNumberOfWords - 1);
		var lBytePosition = 0;
		var lByteCount = 0;
		while (lByteCount < lMessageLength) {
			lWordCount = (lByteCount - (lByteCount % 4)) / 4;
			lBytePosition = (lByteCount % 4) * 8;
			lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
			lByteCount++;
		}
		lWordCount = (lByteCount - (lByteCount % 4)) / 4;
		lBytePosition = (lByteCount % 4) * 8;
		lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
		lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
		lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
		return lWordArray;
	};

	function WordToHex(lValue) {
		var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
		for (lCount = 0; lCount <= 3; lCount++) {
			lByte = (lValue >>> (lCount * 8)) & 255;
			WordToHexValue_temp = "0" + lByte.toString(16);
			WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
		}
		return WordToHexValue;
	};

	function Utf8Encode(string) {
		string = string.replace(/\r\n/g, "\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if ((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	};

	var x = Array();
	var k, AA, BB, CC, DD, a, b, c, d;
	var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
	var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
	var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
	var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

	string = Utf8Encode(string);

	x = ConvertToWordArray(string);

	a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

	for (k = 0; k < x.length; k += 16) {
		AA = a; BB = b; CC = c; DD = d;
		a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
		d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
		c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
		b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
		a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
		d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
		c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
		b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
		a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
		d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
		c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
		b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
		a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
		d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
		c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
		b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
		a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
		d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
		c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
		b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
		a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
		d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
		c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
		b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
		a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
		d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
		c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
		b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
		a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
		d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
		c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
		b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
		a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
		d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
		c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
		b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
		a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
		d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
		c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
		b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
		a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
		d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
		c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
		b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
		a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
		d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
		c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
		b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
		a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
		d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
		c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
		b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
		a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
		d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
		c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
		b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
		a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
		d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
		c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
		b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
		a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
		d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
		c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
		b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
		a = AddUnsigned(a, AA);
		b = AddUnsigned(b, BB);
		c = AddUnsigned(c, CC);
		d = AddUnsigned(d, DD);
	}

	var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

	return temp.toLowerCase();
}

exports.get_accessPassword = (privatekey, parameter) => {
	var str = privatekey;
	for (var i in parameter) {
		str += i + "=" + parameter[i] + "&";
	}
	str = str.slice(0, str.length - 1);
	var md5str = get_md5string(str);
	var md5 = md5str.toLocaleUpperCase()
	return md5;
}

exports.md5convert = (string) => {
	var aa = get_md5string(string);
	return aa;
}

exports.headers = () => {
	return { 'Content-Type': 'application/x-www-form-urlencoded' };
}

exports.getCredentialFunc = async (type) => {
	let con = await firstpagesetting.findOne({ type: type });
	if (con) {
	  return con.content;
	} else {
	  return false;
	}
  };
  

exports.cv_ebase64 = (rstring) => {
	let buff = new Buffer(rstring);
	let base64data = buff.toString('base64');
	return base64data
}

exports.cv_dbase64 = (rstring) => {
	let buff = new Buffer(rstring, 'base64');
	let text = buff.toString('ascii');
	return text;
}

exports.data_save = async (indata, model) => {
	var handle = null;
	var savehandle = new model(indata);
	await savehandle.save().then(rdata => {
		if (!rdata) {
			handle = false;
		} else {
			handle = rdata;
		}
	});
	return handle;
}

exports.session_verify = async (token) => {
	var outdata = null;
	await session_model.findOne({ token: token }).then(rdata => {
		if (!rdata) {
			outdata = false;
		} else {
			outdata = rdata;
		}
	});
	return outdata;
}


exports.get_timestamp = () => {
	return (new Date().valueOf());
}

exports.BfindOne = async (model, condition = {}) => {
	var outdata = null;
	await model.findOne(condition).then(rdata => {
		if (!rdata) {
			outdata = false;
		} else {
			outdata = rdata;
		}
	});
	return outdata;
}

exports.get_userinfor = async (email) => {
	var user = await this.BfindOne(playersUser, { email: email });
	return user;
}

exports.get_time = () => {
	var d = new Date();
	var year = d.getFullYear();
	var month = parseInt(d.getMonth()) + 1;
	var day = d.getDate();
	var h = d.getHours();
	var mm = d.getMinutes();
	var s = d.getSeconds();
	var mh = month > 9 ? month : "0" + month;
	var dd = day > 9 ? day : "0" + day;
	var hh = h > 9 ? h : "0" + h;
	var mms = mm > 9 ? mm : "0" + mm;
	var ss = s > 9 ? s : "0" + s;
	var datestring = year + "-" + mh + "-" + dd + " " + hh + ":" + mms + ":" + ss;
	return datestring;
}

exports.get_time_mili = () => {
	var d = new Date();
	var year = d.getFullYear();
	var month = parseInt(d.getMonth()) + 1;
	var day = d.getDate();
	var h = d.getHours();
	var mm = d.getMinutes();
	var s = d.getSeconds();
	var mh = month > 9 ? month : "0" + month;
	var dd = day > 9 ? day : "0" + day;
	var hh = h > 9 ? h : "0" + h;
	var mms = mm > 9 ? mm : "0" + mm;
	var ss = s > 9 ? s : "0" + s;
	var mili = d.getMilliseconds();
	var datestring = year + "-" + mh + "-" + dd + " " + hh + ":" + mms + ":" + ss + mili;
	return datestring;
}

exports.playerTokenAtLaunch = () => {
	var newtime = get_md5string((new Date()).valueOf() + "");
	return newtime;
}

// exports.player_balanceupdatein =async (amount,username,wallets)=>{

// 	var outdata = await playersUser.findOneAndUpdate({id :username },{$inc : {balance : amount}},{upsert:true,new : true});
// 	if(outdata){
// 		return outdata;
// 	}else{
// 		return false
// 	}
// }

exports.get_date = () => {
	var d = new Date();
	var year = d.getFullYear();
	var month = parseInt(d.getMonth()) + 1;
	var mh = month > 9 ? month : "0" + month;
	var datestring = year + "-" + mh;
	return datestring;
}

exports.BfindOneAndUpdate = async (model, condition = {}, data) => {
	var updatehandle = await model.findOneAndUpdate(condition, data);
	if (!updatehandle) {
		return false
	} else {
		return updatehandle;
	}
}

exports.Bfind = async (model, condition = {}) => {
	var findhandle = null;
	await model.find(condition).then(rdata => {
		findhandle = rdata;
	});
	if (!findhandle) {
		return false;
	} else {
		return findhandle;
	}
}

exports.BSortfind = async (modal, condition = {}, sortcondition = {}) => {
	var data;
	await modal.find(condition).sort(sortcondition).then(rdata => {
		data = rdata;
	});
	if (!data) {
		return false;
	} else {
		return data;
	}
}

exports.sesssion_update_id = async (id) => {
	let times = 1000 * 900;
	let Expires = await firstpagesetting.findOne({ type: "SessionExpiresSetting" });
	if (Expires) {
		times = parseInt(Expires.content.GameSession) * 1000;
	}

	var uphandle = await gamesessionmodel.findOneAndUpdate({ id: id }, { intimestamp: new Date(new Date().valueOf() + times) });
	if (uphandle) {
		uphandle = await session_model.findOneAndUpdate({ email: uphandle.email }, { inittime: new Date(new Date().valueOf() + times) });
		if (uphandle) {
			return true
		} else {
			return false
		}
	}
}

exports.sesssion_update_username = async (username) => {
	let times = 1000 * 900;
	let Expires = await firstpagesetting.findOne({ type: "SessionExpiresSetting" });
	if (Expires) {
		times = parseInt(Expires.content.GameSession) * 1000;
	}
	var uphandle = await gamesessionmodel.findOneAndUpdate({ username: username }, { intimestamp: new Date(new Date().valueOf() + times) });
	if (uphandle) {
		uphandle = await session_model.findOneAndUpdate({ email: uphandle.email }, { inittime: new Date(new Date().valueOf() + times) });
		if (uphandle) {
			return true
		} else {
			return false
		}
	}
}

exports.sesssion_update_email = async (email) => {
	let times = 1000 * 900;
	let Expires = await firstpagesetting.findOne({ type: "SessionExpiresSetting" });
	if (Expires) {
		times = parseInt(Expires.content.GameSession) * 1000;
	}
	await session_model.findOneAndUpdate({ email: email }, { inittime: new Date(new Date().valueOf() + times) });
	var uphandle = await gamesessionmodel.gamesessionmodel({ email: email }, { intimestamp: new Date(new Date().valueOf() + times) });
	if (uphandle) {
		return true
	} else {
		return false
	}
}




// exports.GetCurrency = async  () => {
//     let curen = await firstpagesetting.findOne({type : "PlatFormCurrency"});
//     if (curen && curen.content && curen.content.code) {
//         return  curen.content.code
//     } else {
//         return "INR"
//     }
// }

exports.player_balanceupdatein_Id = async (amount, id, wallets) => {
	var amount = parseFloat(amount);
	console.time()
	var outdata = await playersUser.findOneAndUpdate({ id: id }, { $inc: { balance: amount } }, { new: true, upsert: true });
	console.timeEnd()
	if (!outdata) {
		return false;
	} else {
		// var row = Object.assign({},wallets,{updatedbalance : outdata.balance});
		var row = Object.assign({}, wallets, { updatedbalance: outdata.balance + outdata.bonusbalance });
		this.save_wallets_hitory(row);
		this.sesssion_update_id(id);
		return outdata.balance + outdata.bonusbalance;
	}
}

exports.getPlayerBalanceCorrect = () => {
	if (item.balance < 0) {
		return 0
	} else {
		return parseInt(item.balance)
	}
}

exports.getPlayerBonusBalanceCorrect = () => {
	if (item.balance < 0) {
		return parseInt(item.bonusbalance + item.balance)
	} else {
		return parseInt(item.bonusbalance)
	}
}


exports.player_balanceupdatein_Username = async (amount, username, wallets) => {
	var amount = parseFloat(amount);

	var outdata = await playersUser.findOneAndUpdate({ username: username }, { $inc: { balance: amount } }, { new: true, upsert: true });
	if (!outdata) {
		return false;
	} else {
		// var row = Object.assign({},wallets,{updatedbalance : outdata.balance});
		var row = Object.assign({}, wallets, { updatedbalance: outdata.balance + outdata.bonusbalance });
		this.save_wallets_hitory(row);
		this.sesssion_update_username(username);
		return outdata.balance + outdata.bonusbalance;
	}
}


exports.getPlayerBonusBalanceCorrect = (item) => {
	if (item.balance < 0) {
		return parseInt(item.bonusbalance + item.balance)
	} else {
		return parseInt(item.bonusbalance)
	}
}

exports.save_wallets_hitory = async (rows) => {
	if (rows.debited == 0 && rows.credited == 0) {
	} else {

		let outdata = await playersUser.findOne({ id: rows.userid })
		let bonus = this.getPlayerBonusBalanceCorrect(outdata)
		let row = Object.assign({}, rows, { lastBonusBalance: bonus, updateBonusBalance: bonus });

		await this.data_save(row, wallethistory_model);
	}
	return true
}

exports.get_gameid = async (Launchurl, gameid) => {
	var item = await this.BfindOne(Gamelist, { LAUNCHURL: Launchurl, ID: gameid });
	if (item) {
		return { gameid: item._id, providerid: item.providerid };
	} else {
		return {
      gameid: "616e90cbf787690ea2b0792e",
      providerid: "616514ef7f557374b4eb6dff",
    };
	}
}

exports.PlayerFindByemail = async (email) => {

	// await this.playerFindbyEmailUpdate(email)
	let item = await playersUser.findOne({ email: email });
	if (item) {
		let row = Object.assign({}, item._doc);
		row['balance'] = row.balance + row.bonusbalance;
		return row;
	} else {
		return false;
	}
}

exports.getPlayerBalanceCal = (item) => {
	if (item.balance < 0) {
		let row = {
			balance: 0,
			bonusbalance: parseInt(item.bonusbalance + item.balance),
			sattalimit: item.sattalimit,
			exchangelimit: item.exchangelimit,
			sportsbooklimit: item.sportsbooklimit,
			betdelaytime: item.betdelaytime
		}
		return row;
	} else {
		let row = {
			balance: parseInt(item.balance),
			bonusbalance: parseInt(item.bonusbalance),
			sattalimit: item.sattalimit,
			exchangelimit: item.exchangelimit,
			sportsbooklimit: item.sportsbooklimit,
			betdelaytime: item.betdelaytime
		}
		return row;
	}
}
exports.playerFindbyUseidUpdate = async (userid) => {
	let item = await playersUser.findOne({ id: userid });
	if (item) {
		let d = this.getPlayerBalanceCal(item)
		let row = await this.BfindOneAndUpdate(playersUser, { id: userid }, { balance: d.balance, bonusbalance: d.bonusbalance });
		return row;
	} else {
		return false;
	}
}

exports.playerFindbyEmailUpdate = async (email) => {
	let item = await playersUser.findOne({ email: email });
	if (item) {
		let d = this.getPlayerBalanceCal(item)
		let row = await this.BfindOneAndUpdate(playersUser, { email: email }, { balance: d.balance, bonusbalance: d.bonusbalance });
		return row;
	} else {
		return false;
	}
}


exports.playerFindbyUseNameUpdate = async (username) => {
	let item = await playersUser.findOne({ username: username });
	if (item) {
		let d = this.getPlayerBalanceCal(item)
		let row = await this.BfindOneAndUpdate(playersUser, { username: username }, { balance: d.balance, bonusbalance: d.bonusbalance });
		return row;
	} else {
		return false;
	}
}


exports.playerFindByid = async (id) => {
	// await this.playerFindbyUseidUpdate(id)
	let item = await playersUser.findOne({ id: id });
	if (item) {
		let row = Object.assign({}, item._doc);
		row['balance'] = row.balance + row.bonusbalance;
		row['lastbalance'] = row.balance;
		return row;
	} else {
		return false;
	}
}


exports.playerFindByusername = async (username) => {
	// await this.playerFindbyUseNameUpdate(username)

	let item = await playersUser.findOne({ username: username });
	if (item) {
		let row = Object.assign({}, item._doc);
		row['balance'] = row.balance + row.bonusbalance;
		row['lastbalance'] = row.balance;
		return row;
	} else {
		return false;
	}
}

exports.xpress_return_errorstring = (errocode) => {
	var array = {
		"118": "Game cycle already closed.",
		"117": "Transaction does not exists.",
		"116": "Transaction already exists.",
		"115": "Game cycle exists.",
		"114": "Incorrect player identifier for secure token.",
		"113": "Incorrect parameters for a player session.",
		"112": "Game cycle does not exist.",
		"111": "Unsupported gameid.",
		"110": "Transaction failed.",
		"109": "Wager limit exceeded.",
		"108": "Player account locked.",
		"107": "Insufficient funds.",
		"106": "Invalid secure token.",
		"105": "Request processing services unavailable.",
		"104": "Unknown request.",
		"103": "Incomplete or malformed request.",
		"102": "Invalid platform identifier.",
		"101": "Invalid remote service identifier."
	}
	return array[errocode];
}

exports.winnerpoker_return_errorstring = (errorcode) => {
	var array = {
		"303": "Incorrect player identifier for secure token.",
		"304": "Incomplete or malformed request.",
		"305": "User Balance is not enough.",
	}
	return array[errorcode];
}