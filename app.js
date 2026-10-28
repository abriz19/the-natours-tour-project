const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const reviewRouter = require('./routes/reviewRoute');
const tourRouter = require('./routes/tourRoute');
const userRouter = require('./routes/userRoute');
const viewRouter = require('./routes/viewRoute');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const viewHelpers = require('./utils/viewHelpers');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.locals.h = viewHelpers;

// GLOBAL MIDDLEWARES

// 1, serving static files
app.use(express.static(path.join(__dirname, 'public')));

// 2, set security http headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            // allow tour images hosted on other https sites
            imgSrc: ["'self'", 'data:', 'https:'],
            // upgrading to https breaks plain http://localhost in some browsers
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    }
}));

// 3, logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// 4, request limiter from the same IP
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: { status: 'fail', message: 'Too many requests from this IP. Please try again in an hour.' }
});
app.use('/api', limiter);

// 5, body and cookie parsers
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// data sanitization against NoSQL injection
app.use(mongoSanitize());

// data sanitization against xss attacks
app.use(xss());

// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/', viewRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
