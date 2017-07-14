var express = require('express');
var router = express.Router({mergeParams: true});

var controller = require('../controllers/sensorsController');


router
	.get('/', controller.find)
	.get('/:id', controller.findById)
	.post('/', controller.saveEntry);

module.exports = router;
