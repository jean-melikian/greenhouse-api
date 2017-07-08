// - - - MIDDLEWARES - - - - - - - - - -
const util = require('util');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var admin = require("firebase-admin");

// - - - ROUTES - - - - - - - - - - - -
var index = require('./routes/index');
var sensors = require('./routes/sensors');

// - - - App init - - - - - - - - -
// - - - FCM - - - - - - - - - - - - - -
const fcmSecretFilePath = process.env.FCM_SECRET_KEY_FILE_PATH;
var serviceAccount = require(fcmSecretFilePath);
const fcmDbUrl = "https://greenhouse-20729.firebaseio.com";

var mongoUri = 'mongodb://localhost/greenhouse-' + process.env.BUILD_NAME || 'dev';

// -------------------------------------
// - - - MAIN CODE - - - - - - - - - - -
var app = express();
app.set('build_config', process.env.BUILD_NAME || 'dev');
app.set('debug_prefix', 'greenhouse-api:' + app.get('build_config'));
var debug = require('debug')(app.get('debug_prefix'));
process.title = util.format("greenode-%s", app.get('build_config'));


// Init MongoDB server
mongoose.Promise = global.Promise;
var promise = mongoose.connect(mongoUri, {
	useMongoClient: true
});

promise.then(function () {
	debug(util.format('Successfully connected to the MongoDB server: [%s]', mongoUri));
}).catch(function (err) {
	console.error(err)
});

// Init FCM admin
if (serviceAccount) {
	debug(util.format("Successfully loaded the FCM secret key file from: [%s]", fcmSecretFilePath));
} else {
	debug("Could not load the FCM secret key file as the environment variable FCM_SECRET_KEY_FILE_PATH is undefined...");
}

var defaultApp = admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: fcmDbUrl
});

// Init app

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Init routes
app.use('/', index);
app.use('/sensors', sensors);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.send('error');
});

module.exports = app;
