/**
 * Created by ozone on 03/07/2017.
 */

var mongoose = require('mongoose');

var SensorsSchema = new mongoose.Schema({
	hygrometer: {
		type: Number
	},
	luminosity: {
		type: Number
	},
	created_date: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('Sensors', SensorsSchema);