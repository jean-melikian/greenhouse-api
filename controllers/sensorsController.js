/**
 * Created by ozone on 04/07/2017.
 */
require('../models/sensorsModel');
const util = require('util');
var mongoose = require('mongoose');
var Sensors = mongoose.model("Sensors");
var admin = require('firebase-admin');

var sensorsController = {};

sensorsController.list = function (req, res, next) {
	Sensors.find({}).exec(function (err, entries) {
		if (err) return res.status(400).send(err);
		return res.status(200).send(entries);
	});
};

sensorsController.save = function (req, res, next) {
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


	entry.save(function (err) {
		if (err) return res.status(400).send(util.format("sensorsController: %s", err));
		console.log("Successfully created an employee.");
		return res.status(201).send(entry);
	})
};

module.exports = sensorsController;