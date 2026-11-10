const mongoose = require('mongoose');
const Tour = require('./tourModel');
const opts = {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
};

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please write a review!'],
    },
    rating: {
      type: Number,
      required: [true, 'Please give a rating!'],
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user!'],
    },
  },
  opts
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function () {
  this.populate({ path: 'user', select: 'name photo' });
  // .populate({ path: 'tour', select: 'name' });
});

//Calculate the ratings quantity and average
reviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

//ON SAVE
reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.tour);
});

//ON UPDATE AND DELETE
//findByIdAndUpdate findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function () {
  this.r = await this.model.findOne(this.getQuery());
});
reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne(); does NOT work here, query has already executed
  if (this.r) {
    await this.r.constructor.calcAverageRating(this.r.tour);
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
