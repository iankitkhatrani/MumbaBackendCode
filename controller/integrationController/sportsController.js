const USERSMODEL = require("../../models/users_model");
const playersUser = USERSMODEL.GamePlay;

exports.Authenticate = async (req, res, next) => {
    this.getPlayer(req, res, next);
}

exports.getPlayer = async (req, res, next) => {
    const { token } = req.body;
    var response = await playersUser.findOne({id: token});
    if (response) {
        res.json({
            status: true,
            data: response
        })
    } else {
        res.json({
            status: false
        })
        return next();
    }
}