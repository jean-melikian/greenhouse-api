/**
 * Created by ozone on 04/07/2017.
 */
require('../models/sensorsModel');
const util = require('util');
var mongoose = require('mongoose');
var Sensors = mongoose.model("Sensors");
var admin = require('firebase-admin');
var sensorsController = {};

/**
 *
 * @param params: req.query arguments
 * @returns A query to exec
 */
var queryParamsHandler = function (params) {
	var projection = {};
	var criterias = {};

	if (params.types) {
		var types = params.types.split(',');
		types.forEach(function (type) {
			projection[type] = true;
		});
		// Always return the created_date field
		projection['created_date'] = true;
	}

	if (params.sincetime) {
		criterias['created_date']['$gte'] = new Date(params.aftertime * 1000);
	}

	if (params.totime) {
		criterias['created_date']['$lt'] = new Date(params.totime * 1000);
	}

	// Return the query object
	return Sensors.find(criterias, projection);
};

var sendError = function (res, httpCode, err) {
	return res.status(httpCode).send({
		err_code: err.statusCode,
		err_msg: err.message
	});
};

sensorsController.find = function (req, res, next) {

	var query = queryParamsHandler(req.query);

	query.exec(function (err, entries) {
		if (err) res.status(404).send(err.message);
		var result = {
			count: entries.length,
			entries: entries
		};
		res.status(200).send(result);
	});
};

sensorsController.findById = function (req, res, next) {
	Sensors.findById(req.params.id).exec(function (err, entry) {
		if (err) return res.status(404).send(err.message);
		res.status(200).send(entry);
	});
};

sensorsController.saveEntry = function (req, res, next) {
	var entry = new Sensors(req.body);

	// The topic name can be optionally prefixed with "/topics/".
	var topic = "greenhouse";

	if (entry.hygrometer < 1000) {
		var payload = {
			notification: {
				title: "Hello, your plant needs some water ! :(",
				body: "You haven't given water to your plant since 2 days..."
			},
			data: {
				value: entry.hygrometer.toString(),
				since: Number(3600 * 48).toString()
			}
		};

		// Send a message to devices subscribed to the provided topic.
		admin.messaging().sendToTopic(topic, payload)
			.then(function (response) {
				console.log("Successfully sent message:", response);
			})
			.catch(function (error) {
				console.log("Error sending message:", error);
			});
	}


	entry.saveEntry(function (err) {
		if (err) return sendError(res, 400, err);
		console.log("Successfully created an employee.");
		res.status(201).send(entry);
	})
};

module.exports = sensorsController;