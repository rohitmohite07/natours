const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const { xss } = require('express-xss-sanitizer');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//GLOBAL MIDDLEWARES
//serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//set security HTTP headers
// app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': [
          "'self'",
          'https://api.mapbox.com',
          'https://cdn.jsdelivr.net',
          'https://checkout.razorpay.com',
        ],
        'style-src': [
          "'self'",
          'https://api.mapbox.com',
          'https://fonts.googleapis.com',
          "'unsafe-inline'",
        ],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'connect-src': [
          "'self'",
          'https://api.mapbox.com',
          'https://events.mapbox.com',
          'https://cdn.jsdelivr.net',
          'https://api.razorpay.com',
          'https://lumberjack.razorpay.com',
        ],
        'frame-src': [
          "'self'",
          'https://api.razorpay.com',
          'https://*.razorpay.com',
        ],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'worker-src': ["'self'", 'blob:'],
      },
    },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit request from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again after an hour!',
});
app.use('/api', limiter);

app.set('query parser', 'extended');
//body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

//data sanitization against NoSQL query injuction
app.use(mongoSanitize());

//data sanitization against xss
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'difficulty',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
    ],
  })
);

app.use(compression());

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

app.all('/{*splat}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
