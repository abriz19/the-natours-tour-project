const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = mongoose.Schema({
    review: {
        type: String,
        minLength: [5, 'A review must be at least 5 characters long'],
        trim: true,
        required: [true, 'review can not be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: [true, 'please give the tour a rating from 1 to 5']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A review must belong to a user']
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'A review must belong to a tour.']
    }
});

// one review per user per tour
reviewSchema.index({tour: 1, user: 1}, {unique: true});

reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    // this keyword represents the Review model
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                reviewNum: {$sum: 1},
                reviewRating: {$avg: '$rating'}
            }
        }

    ]);

    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].reviewRating,
            ratingsQuantity: stats[0].reviewNum
        });
    } else{
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0
        });
    }
};

// findByIdAndUpdate / findByIdAndDelete: recalculate using the document the query returned
reviewSchema.post(/^findOneAnd/, async function(doc) {
    if (doc) await doc.constructor.calcAverageRatings(doc.tour);
});

reviewSchema.post('save', async function() {
    // Review.calcAverageRatings(this.tour); // We dont have access to the Review model so we cant use this
    await this.constructor.calcAverageRatings(this.tour);
})


const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
