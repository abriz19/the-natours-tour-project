const AppError = require("../utils/appError");

const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
};

const handleDuplicateFields = (err) => {
    const message = `duplicate field value: ${Object.values(err.keyValue || {}).join(', ')}, please use another value`;
    return new AppError(message, 400);
}

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join(', ')}`
    return new AppError(message, 400);
}

const handleTokenExpiredError = () => {
    return new AppError('Your token has expired. please login again!', 401);
}

const handleJsonWebTokenError = () => {
    return new AppError('Invalid token! please login again.', 401);
}

// turn known library errors into friendly operational errors
const normalizeError = (err) => {
    if (err.name === "CastError") return handleCastError(err);
    if (err.code === 11000) return handleDuplicateFields(err);
    if (err.name === "ValidationError") return handleValidationError(err);
    if (err.name === "TokenExpiredError") return handleTokenExpiredError();
    if (err.name === "JsonWebTokenError") return handleJsonWebTokenError();
    return err;
};

const sendApiError = (err, original, res, isDev) => {
    //operational error trusted error send it back to the client
    if (err.isOperational) {
        const body = { status: err.status, message: err.message };
        if (isDev) {
            body.error = original;
            body.stack = original.stack;
        }
        return res.status(err.statusCode).json(body);
    }

    //programming or other unknown error: don't leak error details
    console.error('Error:', original);
    res.status(500).json({
        status: 'error',
        message: isDev ? original.message : 'Sorry something went wrong',
        ...(isDev && { error: original, stack: original.stack })
    });
};

const renderErrorPage = (err, original, res, isDev) => {
    if (!err.isOperational) console.error('Error:', original);
    const statusCode = err.isOperational ? err.statusCode : 500;
    res.status(statusCode).render('error', {
        title: 'Something went wrong',
        statusCode,
        msg: err.isOperational || isDev ? err.message : 'Please try again later.'
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    const isDev = process.env.NODE_ENV === 'development';
    const error = normalizeError(err);

    if (req.originalUrl.startsWith('/api')) {
        sendApiError(error, err, res, isDev);
    } else {
        renderErrorPage(error, err, res, isDev);
    }
};
