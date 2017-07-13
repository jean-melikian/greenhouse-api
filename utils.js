/**
 * Created by ozone on 13/07/2017.
 */
var utils = {};

utils.sendError = function (res, httpCode, err) {
	return res.status(httpCode).send({
		error_msg: err.message
	});
};

module.exports = utils;