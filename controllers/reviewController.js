const Review = require('../model/reviewModel');
const Tour = require('../model/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// admins and lead guides can moderate any review, users only their own
const canManageReview = (user, review, moderatorRoles) => {
    if (moderatorRoles.includes(user.role)) return true;
    const ownerId = review.user && (review.user._id || review.user);
    return String(ownerId) === String(user._id);
};

module.exports.gettingAllReviews = catchAsync(async (req, res, next) => {
    let filter = {};
    if(req.params.tourId) filter = {tour: req.params.tourId}
    const reviews = await Review.find(filter);

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    })
})

module.exports.getReview = catchAsync(async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if(!review) {
        return next(new AppError('there is no review with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    })
})

module.exports.createReview = catchAsync(async (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    // a review always belongs to the logged-in user
    req.body.user = req.user.id;

    const tour = await Tour.findById(req.body.tour);
    if (!tour) {
        return next(new AppError('there is no tour with this ID', 404));
    }

    const review = await Review.create({
        review: req.body.review,
        rating: req.body.rating,
        tour: req.body.tour,
        user: req.body.user
    });

    res.status(201).json({
        status: 'success',
        data: {
            review
        }
    })
});

module.exports.updateReview = catchAsync(async (req, res, next) => {
    const existing = await Review.findById(req.params.id);
    if (!existing) {
        return next(new AppError('there is no review with this ID', 404));
    }
    if (!canManageReview(req.user, existing, ['admin'])) {
        return next(new AppError('you can only edit your own reviews', 403));
    }

    // only the text and the rating can be changed
    const update = {};
    if (req.body.review !== undefined) update.review = req.body.review;
    if (req.body.rating !== undefined) update.rating = req.body.rating;

    const review = await Review.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            review
        }

    })
});

module.exports.deleteReview = catchAsync(async (req, res, next) => {
    const existing = await Review.findById(req.params.id);
    if (!existing) {
        return next(new AppError('there is no review with this ID', 404));
    }
    if (!canManageReview(req.user, existing, ['admin', 'lead-guide'])) {
        return next(new AppError('you can only delete your own reviews', 403));
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null
    })
})
