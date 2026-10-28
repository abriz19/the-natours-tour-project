const Tour = require('../model/tourModel');
const Review = require('../model/reviewModel');
const APIfeatures = require('./../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.topFiveCheapTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = 'price,-ratingsAverage';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty,duration';
    next();
}

exports.getAllTours = catchAsync(async (req, res, next) => {
    const features = new APIfeatures(Tour.find(), req.query)
            .filter()
            .sort()
            .fields()
            .pagination();
    const tours = await features.query;

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours: tours
        }
    });
});



exports.getSingleTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id).populate('reviews');
    if(!tour){
        return next(new AppError('there is no tour with this ID', 404));
     }
    res.status(200).json({
        status: 'success',
        data: {
            tour: tour
        }
    });

});


exports.updateTour = catchAsync(async (req, res, next) => {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if(!tour){
            return next(new AppError('there is no tour with this ID', 404));
         }
        res.status(200).json({
            status: 'success',
            data: {
                tour: tour
            }
        });

});


exports.createTour = catchAsync(async (req, res, next) => {
        const tour = await Tour.create(req.body);

        res
        .status(201)
        .json({
            status: 'success',
            data: {tour: tour}
        });

});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
        return next(new AppError('there is no tour with this ID', 404));
    }
    // reviews of a deleted tour are no longer reachable, so remove them too
    await Review.deleteMany({ tour: tour._id });

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.getTourStats = catchAsync(async (req, res, next) => {
        const stats = await Tour.getStats();
        res
        .status(200)
        .json({
            status: 'success',
            data: {
                stats
            }
        });

});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
        const year = req.params.year * 1;
        if (!Number.isInteger(year)) {
            return next(new AppError('please provide a valid year', 400));
        }
        const plan = await Tour.getMonthlyPlan(year);
        res.status(200).json({
            status: 'success',
            result: plan.length,
            data: {
                plan
            }
        });

});

// "lat,lng" -> [lat, lng] as numbers, or null when the format is wrong
const parseLatLng = latlng => {
    const [lat, lng] = (latlng || '').split(',').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        return null;
    }
    return [lat, lng];
};

exports.toursWithInYourLocation = catchAsync ( async (req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const coords = parseLatLng(latlng);
    if(!coords){
        return next(new AppError('please provide your location in the format lat,lng', 400));
    }
    if (!(distance > 0)) {
        return next(new AppError('please provide a distance greater than 0', 400));
    }
    const [lat, lng] = coords;
    // radius in radians = distance / radius of the earth
    const radius = unit === 'mi'? distance/3963.2 : distance/6378.1;

    const tours = await Tour.find({startLocation: {$geoWithin: {$centerSphere:[[lng, lat], radius]}}});

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    })
})


exports.getAllDistances = catchAsync(async (req, res, next) => {
    const {latlng, unit} = req.params;
    const coords = parseLatLng(latlng);
    if(!coords){
        return next(new AppError('please provide your location in the format lat,lng', 400));
    }
    const [lat, lng] = coords;
    // distances come back in meters
    const multiplier = unit === 'mi'? 0.000621371 : 0.001;

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near:{
                    type: 'Point',
                    coordinates: [lng, lat]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier,
                query: { secretTour: { $ne: true } }
            },
        },
        {
            $project:{
                distance: 1,
                name: 1,
                slug: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        results: distances.length,
        data: {
            distances
        }
    });
 })
