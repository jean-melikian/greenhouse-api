var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
	res.status(404).send({
		app: 'greenhouse-iot',
		build: process.env.BUILD_NAME || 'dev'
	});
});

module.exports = router;
