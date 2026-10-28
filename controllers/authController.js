const { promisify }  = require('util');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const User = require('../model/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');

const generateToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, req, res) => {
    const token = generateToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'lax',
        // only send the cookie over https when the request actually came in over https
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    }
    res.cookie('jwt', token, cookieOptions);

    // don't send the password hash back
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: { user }
    });
}

// reads the token from the Authorization header (API clients) or the jwt cookie (browser)
const getToken = req => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1];
    }
    if (req.cookies && req.cookies.jwt) {
        return req.cookies.jwt;
    }
    return undefined;
}

exports.signupUser = catchAsync( async(req, res, next) =>{
    // role is not taken from the body so nobody can sign themselves up as an admin
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirmation: req.body.passwordConfirmation
    });
    createSendToken(newUser, 201, req, res);
});

exports.loginUser = catchAsync( async(req, res, next) => {
    const {email, password} = req.body;

    //1, check the email and password fields are filled
    if(!email || !password){
        return next(new AppError('please provide email and password', 400));
    }

    // 2, compare the credintial password is the same with the encrypted one
    const user = await User.findOne({email: email}).select('+password');
    if(!user || !(await user.comparePassword(password, user.password))){
        return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, req, res);
});

exports.logout = (req, res) => {
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax' });
    res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync( async(req, res, next) => {
    // 1, getting token and check of it's there
    const token = getToken(req);
    if(!token){
        return next(new AppError('please login first!', 401));
    }

    // 2, token verification
    const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3, check if the user still exists
    const freshUser = await User.findById(decode.id);
    if (!freshUser){
        return next(new AppError('the user with this token does no longer exist!', 401));
    }

    // 4, check if user changed password after the token is issued
    if(freshUser.changedPasswordAfter(decode.iat)){
        return next(new AppError('the user has changed password recently! please login again.', 401));
    }

    req.user = freshUser;
    res.locals.user = freshUser;
    next();
});

// For rendered pages: puts the logged-in user (if any) on res.locals.user. Never throws.
exports.isLoggedIn = async (req, res, next) => {
    const token = req.cookies && req.cookies.jwt;
    if (token) {
        try {
            const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
            const currentUser = await User.findById(decode.id);
            if (currentUser && !currentUser.changedPasswordAfter(decode.iat)) {
                req.user = currentUser;
                res.locals.user = currentUser;
            }
        } catch (err) {
            // invalid or expired token: treat the visitor as logged out
        }
    }
    next();
};

exports.restrict = (...roles) => {
    // roles returns an array of passed arguments
    return (req, res, next) => {
        if(!req.user || !roles.includes(req.user.role)){
            return next(new AppError('you are not allowed to perform this action', 403));
        }
        next();
    }
}

module.exports.forgotPassword = catchAsync( async(req, res, next) => {
    // 1, get user based on posted email
    const user = await User.findOne({email: req.body.email});

    if(!user){
        return next(new AppError('There is no user with this email', 404));
    }
    // 2, generate the random reset token
    const resetToken = user.forgotPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // 3, send it to user's email (the link opens the reset page of the website)
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    const message = `Forgot your password? Open this link to choose a new one:\n${resetUrl}\n\nThe link is valid for 10 minutes. If you didn't forget your password please ignore this email.`;

    if (process.env.NODE_ENV === 'development') {
        console.log('Password reset link:', resetUrl);
    }

    try{
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token, valid for only 10 mins',
            message
        });
        res.status(200).json({
            status:  'success',
            message: 'your reset token is sent'
        });
    }catch(err){
        user.passwordResetToken = undefined;
        user.resetTokenExpiresAt = undefined;
        await user.save({validateBeforeSave: false});
        return next(new AppError('There is a problem while sending the email! Please try again', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    // 1, check if the user exists
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: hashedToken, resetTokenExpiresAt: {$gt: Date.now()}});
    if(!user) {
        return next(new AppError('Invalid token or the token has expired', 400));
    }
    // 2, update the user password (passwordChangedAt is set in the model's pre-save hook)
    user.password = req.body.password;
    user.passwordConfirmation = req.body.passwordConfirmation;
    user.resetTokenExpiresAt = undefined;
    user.passwordResetToken = undefined;
    await user.save();

    // 3, log in the user
    createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async(req, res, next) => {
    // 1, get the posted user from the collection
    const user = await User.findById(req.user._id).select('+password');
    // 2, check if the user password is the same with the one found in DB
    const correct = await user.comparePassword(req.body.oldPassword || '', user.password);
    if(!correct){
        return next(new AppError('your old password is not correct! please enter again', 400));
    }
    // 3, if so, change the password
    user.password = req.body.newPassword;
    user.passwordConfirmation = req.body.confirmPassword;
    await user.save();

    // 4, log in the user
    createSendToken(user, 200, req, res);
})
