/**
 * Created by ozone on 12/07/2017.
 */

var admin = require('firebase-admin');

var fcmModule = {};

fcmModule.notify = function (topic, notification, data) {
	var payload = {
		notification: notification,
		data: data
	};

	// Send a message to devices subscribed to the provided topic.
	admin.messaging().sendToTopic(topic, payload)
		.then(function (response) {
			console.log("Successfully sent message:", response);
		})
		.catch(function (error) {
			console.log("Error sending message:", error);
		});

};

module.exports = fcmModule;