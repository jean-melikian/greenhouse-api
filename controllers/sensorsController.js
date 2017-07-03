/**
 * Created by ozone on 04/07/2017.
 */
require('../models/sensorsModel');
var mongoose = require('mongoose');
var Sensors = mongoose.model("Sensors");

var sensorsController = {};

sensorsController.list = function (req, res, next) {
	Sensors.find({}).exec(function (err, entries) {
		if (err) return res.status(400).send(err);
		return res.status(200).send(entries);
	});
};

sensorsController.save = function (req, res, next) {
	var entry = new Sensors(req.body);

	entry.save(function (err) {
		if (err) return res.status(400).send(err);
		console.log("Successfully created an employee.");
		return res.status(201).send(entry);
	})
};

module.exports = sensorsController;