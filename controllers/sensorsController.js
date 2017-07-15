/**
 * Created by ozone on 04/07/2017.
 */
var sensorsModel = require('../models/sensorsModel');
const util = require('util');
var mongoose = require('mongoose');
var Sensors = mongoose.model("Sensors");
var fcm = require('../modules/fcm');
var moment = require('moment');
var utils = require('../utils');

var sensorsController = {};
var fcmTopic = undefined; // Initialized by the saveEntry

const periodHours = 1;
const notificationCooldownDurationMinutes = 1;
const thresholds = {
	soil_humidity: 40,
	luminosity: 35,
	air_humidity: 40,
	temperature: 15
};

const dayStart = moment('06:30', "HH:mm");
const dayEnd = moment('20:30', "HH:mm");

moment.locale('en');

var lastNotificationMoment = null;
var notificationCooldownMoment = null;
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

	if (params.sincetime || params.untiltime) {
		criterias = {
			created_date: {}
		}
	}

	if (params.sincetime && !isNaN(params.sincetime)) {
		criterias['created_date']['$gte'] = new Date(parseInt(params.sincetime) * 1000).toISOString();
	}

	if (params.untiltime && !isNaN(params.sincetime)) {
		criterias['created_date']['$lt'] = new Date(parseInt(params.untiltime) * 1000).toISOString();
	}

	// Return the query object
	return Sensors.find(criterias, projection);
};

var checkLastValues = function (fcmTopic) {
	// CHECKING PROGRESSION
	var period = new Date().now - 1000 * 60 * 60 * periodHours;
	console.log(util.format("Checking entries since: %s", period.toString()));

	return queryParamsHandler({
		sincetime: period.valueOf()
	}).sort({date: 'ascending'}).exec(function (err, entries) {
		if (err) return utils.sendError(res, 500, err.message);

		var lastEntry = entries[entries.length - 1];

		var average = {
			soil_humidity: .0,
			luminosity: .0,
			air_humidity: .0,
			temperature: .0
		};

		var soilHumTmp = .0;
		var lumTmp = .0;
		var airHumTmp = .0;
		var temperatureTmp = .0;

		// Processing average for the period
		entries.forEach(function (entry, index, array) {
			soilHumTmp += (entry.soil_humidity != 0) ? parseFloat(entry.soil_humidity) : .0;
			lumTmp += (entry.luminosity != 0) ? parseFloat(entry.luminosity) : .0;
			airHumTmp += (entry.air_humidity != 0) ? parseFloat(entry.air_humidity) : .0;
			temperatureTmp += (entry.temperature != 0) ? parseFloat(entry.temperature) : .0;
		});

		var lackings = [];

		soilHumTmp /= entries.length;
		lumTmp /= entries.length;
		airHumTmp /= entries.length;
		temperatureTmp /= entries.length;

		average.soil_humidity = parseFloat(soilHumTmp);
		average.luminosity = parseFloat(lumTmp);
		average.air_humidity = parseFloat(airHumTmp);
		average.temperature = parseFloat(temperatureTmp);

		console.log(util.format("Averages: %j", average));


		if (average.soil_humidity <= thresholds.soil_humidity) {
			lackings.push({
				description: "soil humidity",
				lacking: "water",
				current: util.format("at %d%%", lastEntry.soil_humidity.toPrecision(1))
			});
		}

		if (average.luminosity <= thresholds.luminosity) {
			lackings.push({
				description: "luminosity",
				lacking: "light",
				current: util.format("at %d%%", lastEntry.luminosity.toPrecision(1))
			});
		}

		if (average.air_humidity <= thresholds.air_humidity) {
			lackings.push({
				description: "air humidity",
				lacking: "more humid air",
				current: util.format("at %d%%", lastEntry.air_humidity.toPrecision(1))
			});
		}

		if (average.temperature <= thresholds.temperature) {
			lackings.push({
				description: "temperature",
				lacking: "more heat",
				current: util.format("at %d°C", lastEntry.temperature.toPrecision(1))
			});
		}

		// Prepare and send notification only if needed and passed the notification interval

		if (lackings.length > 0) {

			console.log(util.format("lackings: %j", lackings));
			var now = moment();

			if (now.isBetween(dayStart, dayEnd)) {
				if (now.isSameOrAfter(notificationCooldownMoment) || notificationCooldownMoment == null || notificationCooldownMoment == undefined) {
					console.log(notificationCooldownMoment);

					moment().subtract(notificationCooldownDurationMinutes, 'minutes');
					console.log(util.format("lackings: %j", lackings));
					var strLackings = "";
					var strLackingsInfos = "";

					lackings.forEach(function (needing, index, array) {
						if (index > 0) {

							if (index < array.length - 1) {
								strLackings += ", ";
							} else {
								strLackings += " and ";
							}
						}
						strLackings += needing.lacking;
						strLackingsInfos += util.format("The %s is currently %s...\n", needing.description, needing.current);
					});
					var notificationTitle = util.format("%s needs some %s ! :(", "Plant 1", strLackings);
					fcm.notify(fcmTopic, {
							title: notificationTitle,
							body: strLackingsInfos
						},
						{
							value: lastEntry.soil_humidity.toString(),
							since: Number(3600 * 48).toString()

						}
					);

					lastNotificationMoment = moment();
					notificationCooldownMoment = moment().add(notificationCooldownDurationMinutes, 'minutes');
				} else {
					console.log(util.format("The last notification has been sent %s. Notifications won't be thrown before %s!", lastNotificationMoment.fromNow(), notificationCooldownMoment.fromNow()));
				}
			} else {
				console.log("It is night now, no notification shall be sent.");
			}
		}

	});
};

sensorsController.find = function (req, res, next) {

	var query = queryParamsHandler(req.query);

	query.exec(function (err, entries) {
		if (err) return utils.sendError(res, 500, err);
		if (entries.length == 0) return utils.sendError(res, 204, {error_msg: "No content"});

		var result = {
			count: entries.length,
			entries: entries
		};
		res.status(200).send(result);
	});
};

sensorsController.findById = function (req, res, next) {
	Sensors.findById(req.params.id).exec(function (err, entry) {
		if (err) return utils.sendError(res, 404, err);
		if (!entry) return utils.sendError(res, 204, {error_msg: "No content"});
		res.status(200).send(entry);
	});
};

sensorsController.saveEntry = function (req, res, next) {

	var entry = new Sensors(req.body);
	// The topic description can be optionally prefixed with "/topics/".
	if (fcmTopic == undefined || fcmTopic == null)
		fcmTopic = req.app.get('fcm_topic');

	entry.save(function (err) {
		if (err) return utils.sendError(res, 400, err);
		console.log("Successfully created an employee.");

		checkLastValues(fcmTopic);

		res.status(201).send(entry);
	});
};

module.exports = sensorsController;