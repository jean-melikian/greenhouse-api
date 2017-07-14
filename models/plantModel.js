/**
 * Created by ozone on 12/07/2017.
 */

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var PlantSchema = new mongoose.Schema(
	{
		uuid: {
			type: String,
			required: true
		},
		name: {
			type: String,
			required: false
		},
		sensors: [
			{
				type: ObjectId,
				ref: 'Sensor'
			}
		],
		created_date: {
			type: Date,
			default: Date.now
		}
	},
	{
		_id: false
	}
);

module.exports = mongoose.model('Plant', PlantSchema);