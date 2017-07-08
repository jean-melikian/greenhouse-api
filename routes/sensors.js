var express = require('express');
var router = express.Router();

var controller = require('../controllers/sensorsController');


/* GET users listing. */
router
	.get('/', controller.find)
	.get('/:id', controller.findById)
	.post('/', controller.saveEntry);

module.exports = router;
