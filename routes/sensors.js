var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var moment = require('moment');
var jsonParser = bodyParser.json();

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.send('respond with a resource');
}).post('/', jsonParser, function (req, res, next) {
	if (!req.body) return res.sendStatus(400);
	req.body['timestamp'] = moment(new Date()).format("YYYY-MM-DD HH:mm:ss.SSS");
	console.log(req.body);
	return res.sendStatus(201);
});

module.exports = router;
