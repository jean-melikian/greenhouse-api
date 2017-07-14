/**
 * Created by ozone on 13/07/2017.
 */

var PlantSchema = require('../models/plantModel');
var mongoose = require('mongoose');
var Plant = mongoose.model('Plant');
var utils = require('../utils');

var plantsController = {};

plantsController.find = function (req, res, next) {
	Plant.find({}).exec(function (err, entries) {
		if(entries.length == 0) utils.sendError(res, 204, {err_msg: "No plants yet"});
		if(err) utils.sendError(res, 500, err);

		var result = {
			count: entries.length,
			entries: entries
		};

		return res.status(200).send(result);
	});
};

plantsController.findByUuid = function(req, res, next) {

	Plant.findOne({'uuid': req.query.plantUuid}).exec(function (err, entry) {
		if(err) utils.sendError(res, 500, err);
		if(!entry) utils.sendError(res, 204, {err_msg: "This plant doesn't exist"});

		return res.status(200).send(entry);
	});
};

plantsController.create = function (req, res, next) {

};

module.exports = plantsController;