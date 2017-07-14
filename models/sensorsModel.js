/**
 * Created by ozone on 03/07/2017.
 */

var mongoose = require('mongoose');

var SensorsSchema = new mongoose.Schema({
	plant: {
		type: String, // 'uuid' field
		ref: 'Plant'
	},
	hygrometer: {
		type: Number,
		required: true
	},
	luminosity: {
		type: Number,
		required: true
	},
	created_date: {
		type: Date,
		default: Date.now
	}
})
	.pre('save', function (next) {
		this.hygrometer = 100 - (this.hygrometer * 100) / 1024;
		this.luminosity = 100 - (this.luminosity * 100) / 1024;
		next();
	});

module.exports = mongoose.model('Sensors', SensorsSchema);