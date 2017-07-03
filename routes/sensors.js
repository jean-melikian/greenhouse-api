var express = require('express');
var router = express.Router();

var controller = require('../controllers/sensorsController');


/* GET users listing. */
router.get('/', controller.list)
	.post('/', controller.save);

module.exports = router;
