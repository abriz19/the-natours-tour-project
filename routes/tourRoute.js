const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoute');
const router = express.Router();

//router.param('id',deviceController.checkId)

router.use('/:tourId/reviews', reviewRouter);

router
.route('/distances/:latlng/unit/:unit')
.get(tourController.getAllDistances)

router
.route('/tours-withIn/:distance/center/:latlng/unit/:unit')
.get(tourController.toursWithInYourLocation)

router
.route('/simple-route/:year')
.get(tourController.getMonthlyPlan)
router
.route('/get-stats')
.get(tourController.getTourStats);
router
.route('/top-five-cheap-tours')
.get(tourController.topFiveCheapTours, tourController.getAllTours);

router
.route('/')
.get(tourController.getAllTours)
.post(authController.protect, authController.restrict('admin', 'lead-guide'), authController.blockDemo(), tourController.createTour);

router
.route('/:id')
.patch(authController.protect, authController.restrict('admin', 'lead-guide'), authController.blockDemo(), tourController.updateTour)
.get(tourController.getSingleTour)
.delete(authController.protect, authController.restrict('admin', 'lead-guide'), authController.blockDemo(), tourController.deleteTour);

module.exports = router;