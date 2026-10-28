const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        maxLength:[40, 'A tour name must have a maximum length of 40'],
        minLength:[10, 'A tour name must have a minimum length of 10'],
        trim: true
    },
    duration:{
        type: Number,
        required: true,
    },
    maxGroupSize: {
        type: Number
    },
    slug: String,
    secretTour:{
        type: Boolean,
        default: false
    },
    difficulty: {
       type: String,
       enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'A tour should have a difficulty of either: easy, medium, or hard'
       }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        max: [5, 'ratings average has to be less or equal to be 5'],
        min: [1, 'ratings average has to be greater or equal to 1'],
        set: val => Math.round(val*10)/10 // we use this method to make some calculation on the value before it is stored
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: true
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val){
                if (val === null || val === undefined) return true;
                // on create/save `this` is the document, on updates it is the query
                let price = this.price;
                if (this instanceof mongoose.Query) {
                    const update = this.getUpdate() || {};
                    price = update.price !== undefined ? update.price : (update.$set && update.$set.price);
                }
                // if the price is not part of an update we can't compare, so let it through
                return price === undefined || val < price;
            },
            message: 'discount price ({VALUE}) should be less than the normal price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: true
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    startDate: [Date],
    startLocation: {
        //GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: {
            type: [Number], //longitude and lattitude
            default: undefined
        },
        address: String,
        description: String
    },
    locations: [
      {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number], //longitude and lattitude
        address: String,
        description: String,
        day: Number
      }
     ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ]
    },
    {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

tourSchema.index({price: 1, ratingsAverage: 1});
tourSchema.index({slug: 1});
tourSchema.index({startLocation: '2dsphere'});

tourSchema.virtual('durationInWeek').get(function(){
    return this.duration/7;
})


tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

tourSchema.pre('save', function(next){
    if (this.isModified('name')) {
        this.slug = slugify(this.name, {lower: true});
    }
    // a start location without coordinates isn't valid GeoJSON and would be rejected by the 2dsphere index
    const coords = this.startLocation && this.startLocation.coordinates;
    if (!coords || coords.length !== 2) {
        this.startLocation = undefined;
    }
    next();
})

// keep the slug in sync when a tour is renamed with findByIdAndUpdate
tourSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update && update.name) {
        update.slug = slugify(update.name, {lower: true});
    } else if (update && update.$set && update.$set.name) {
        update.$set.slug = slugify(update.$set.name, {lower: true});
    }
    next();
});

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: ('-passwordChangedAt -__v')
    });
    next();
})

tourSchema.pre(/^find/, function(next){
    this.find({secretTour: {$ne: true}});
    next();
})


// statistics grouped by difficulty
tourSchema.statics.getStats = function() {
    return this.aggregate([
        {
            $match: {ratingsAverage: {$gte: 2}}
        },
        {
            $group:   {
                _id: {$toUpper: '$difficulty'},
                num: {$sum: 1},
                numRatings: {$sum: '$ratingsQuantity'},
                avgPrice: {$avg: '$price'},
                maxPrice: {$max: '$price'},
                minPrice: {$min: '$price'},
                averageRatings: {$avg: '$ratingsAverage'}
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ]);
};

// how many tours start in each month of the given year
tourSchema.statics.getMonthlyPlan = function(year) {
    return this.aggregate([
        {
            $unwind: '$startDate'
        },
        {
            $match: {
                startDate: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: {$month: '$startDate'},
                numOfTours: {$sum: 1},
                tours: {$push: '$name'}
            }
        },
        {
            $addFields: {month: '$_id'}
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {month: 1}
        }
    ]);
};


const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
