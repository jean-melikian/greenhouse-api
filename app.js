var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var admin = require("firebase-admin");
var serviceAccount = require('./google-services.json');

var index = require('./routes/index');
var sensors = require('./routes/sensors');

var app = express();

mongoose.Promise = global.Promise;
var mongoUri = 'mongodb://localhost/greenhouse-dev';
var promise = mongoose.connect(mongoUri, {
	useMongoClient: true
});

promise.then(function () {
	console.log('Successfully connected to the MongoDB server !');
}).catch(function (err) {
	console.error(err)
});

var defaultApp = admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://greenhouse-20729.firebaseio.com"
});
console.log(defaultApp.name);


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

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
