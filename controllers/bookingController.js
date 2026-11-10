const crypto = require('crypto');

const Tour = require('./../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const razorpay = require('../utils/razorpay');
const Booking = require('../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);

  const amount = Math.round(tour.price * 100);

  const options = {
    amount,
    currency: 'INR',
    receipt: `tour_${tour.id}`,
    notes: {
      tourId: tour._id.toString(),
      userId: req.user.id,
    },
  };

  const order = await razorpay.orders.create(options);

  res.status(200).json({
    status: 'success',
    order,
    key: process.env.RAZORPAY_KEY_ID,
    tour: {
      name: tour.name,
      description: tour.summary,
      price: tour.price,
    },
  });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Payment details missing!', 400));
  }

  // 1. Recompute the signature: HMAC-SHA256 of "order_id|payment_id"
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const generatedBuffer = Buffer.from(generatedSignature);
  const receivedBuffere = Buffer.from(razorpay_signature);

  if (
    generatedBuffer.length !== receivedBuffere.length ||
    !crypto.timingSafeEqual(generatedBuffer, receivedBuffere)
  ) {
    return next(new AppError('Inavalid payment signature!', 400));
  }

  // 2. Fetch the order from Razorpay so we trust its data, not the browser's
  const order = await razorpay.orders.fetch(razorpay_order_id);

  if (order.notes.userId !== req.user.id) {
    return next(new AppError('This order does not belongs to you!', 403));
  }

  // 3. Don't create a duplicate if this payment was already recorded
  const existing = await Booking.findOne({
    razorpayPaymentId: razorpay_payment_id,
  });

  if (existing) {
    return res
      .status(200)
      .json({ status: 'success', data: { booking: existing } });
  }

  // 4. Create the booking
  const booking = await Booking.create({
    tour: order.notes.tourId,
    user: req.user.id,
    price: order.amount / 100, // paise -> rupees
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
  });

  res.status(201).json({ status: 'success', data: { booking } });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => { });

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
