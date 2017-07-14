/**
 * Created by ozone on 13/07/2017.
 */

var express = require('express');
var plantsRouter = express.Router();
var sensorsRouter = require('./sensors');
var controller = require('../controllers/plantsController');

plantsRouter.use('/:plantUuid/sensors', sensorsRouter);

plantsRouter
	.get('/', controller.find)
	.get('/:plantUuid', controller.findByUuid)
	.post('/', controller.create);

module.exports = plantsRouter;