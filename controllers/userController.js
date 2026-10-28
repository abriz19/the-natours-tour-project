const User = require('../model/userModel');
const Review = require('../model/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


const filterObj =  (obj, ...updatedFileds ) => {
    const newObj = {};
    Object.keys(obj).forEach(element => {
    if(updatedFileds.includes(element)){
        newObj[element]= obj[element];
    }
})
  return newObj;
}




exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: users
    })
});


exports.getSingleUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new AppError('there is no user with this ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    })
});


// admins can create users with any role (normal visitors use /signup)
exports.createUser = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        passwordConfirmation: req.body.passwordConfirmation
    });
    newUser.password = undefined;

    res.status(201).json({
        status: 'success',
        data: {
            user: newUser
        }
    })
});


exports.updatedUser = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirmation) {
        return next(new AppError('This route is not for password updates.', 400));
    }
    if (req.params.id === req.user.id && req.body.role && req.body.role !== req.user.role) {
        return next(new AppError('You can not change your own role.', 400));
    }

    const filteredBody = filterObj(req.body, 'name', 'email', 'role');
    const user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
        new: true,
        runValidators: true
    });
    if (!user) {
        return next(new AppError('there is no user with this ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    })
});


exports.getMe = catchAsync(async(req, res, next) => {

    const user = await User.findById(req.user.id);

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    })
});

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1, check if a user posted a password
    if(req.body.password || req.body.passwordConfirmation){
        return next(new AppError('You are not allowed to change your password in this route', 400));
    }
    // 2, update the user
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        message: 'Updated successfully',
        data: updatedUser
    })
})


exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false});

    // also log the user out of the website
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'lax' });
    res.status(204).json({
        status: 'success'
    })
})


exports.deleteUser = catchAsync(async (req, res, next) => {
    if (req.params.id === req.user.id) {
        return next(new AppError('You can not delete your own account from here.', 400));
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
        return next(new AppError('there is no user with this ID', 404));
    }

    // remove the user's reviews and refresh the ratings of the tours they reviewed
    const reviews = await Review.find({ user: user._id });
    await Review.deleteMany({ user: user._id });
    const tourIds = [...new Map(reviews.map(r => [String(r.tour), r.tour])).values()];
    await Promise.all(tourIds.map(tourId => Review.calcAverageRatings(tourId)));

    res.status(204).json({
        status: 'success',
        data: null
    })
});
