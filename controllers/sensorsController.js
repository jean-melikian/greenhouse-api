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

const periodHours = 1;
const notificationCooldownDurationMinutes = 1;
const thresholds = {
	hygrometer: 40,
	luminosity: 40
};

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
			hygrometer: .0,
			luminosity: .0
		};

		var hygroTmp = .0;
		var lumTmp = .0;

		console.log(entries);
		// Processing average for the period
		entries.forEach(function (entry, index, array) {
			hygroTmp += (entry.hygrometer != 0) ? parseFloat(entry.hygrometer) : .0;
			lumTmp += (entry.luminosity != 0) ? parseFloat(entry.luminosity) : .0;
		});

		var lackings = [];

		hygroTmp /= entries.length;
		lumTmp /= entries.length;

		average.hygrometer = parseFloat(hygroTmp);
		average.luminosity = parseFloat(lumTmp);

		console.log(util.format("Averages: %j", average));


		if (average.hygrometer <= thresholds.hygrometer) {
			lackings.push({
				description: "water",
				current: lastEntry.hygrometer
			});
		}

		if (average.luminosity <= thresholds.luminosity) {
			lackings.push({
				description: "luminosity",
				current: lastEntry.luminosity
			});
		}

		// Prepare and send notification only if needed and passed the notification interval

		if (lackings.length > 0) {

			console.log(util.format("lackings: %j", lackings));
			var now = moment();

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
					strLackings += needing.description;
					strLackingsInfos += util.format("The %s is currently at %d%%...\n", needing.description, needing.current.toPrecision(1));
				});
				var notificationTitle = util.format("%s needs some %s ! :(", "Plant 1", strLackings);
				fcm.notify(fcmTopic, {
						title: notificationTitle,
						body: strLackingsInfos
					},
					{
						value: lastEntry.hygrometer.toString(),
						since: Number(3600 * 48).toString()

					}
				);

				lastNotificationMoment = moment();
				notificationCooldownMoment = moment().add(notificationCooldownDurationMinutes, 'minutes');
			} else {
				console.log(util.format("The last notification has been sent %s. Notifications won't be thrown before %s!", lastNotificationMoment.fromNow(), notificationCooldownMoment.fromNow()));
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
	// The topic name can be optionally prefixed with "/topics/".
	var fcmTopic = util.format("greenhouse-%s", req.app.get('build_config'));

	entry.save(function (err) {
		if (err) return utils.sendError(res, 400, err);
		console.log("Successfully created an employee.");

		checkLastValues(fcmTopic);

		res.status(201).send(entry);
	});
};

module.exports = sensorsController;