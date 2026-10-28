const Tour = require('../model/tourModel');
const User = require('../model/userModel');
const Review = require('../model/reviewModel');
const APIfeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const PAGE_SIZE = 9;
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const SORT_OPTIONS = [
    { value: '-ratingsAverage', label: 'Top rated' },
    { value: 'price', label: 'Price: low to high' },
    { value: '-price', label: 'Price: high to low' },
    { value: 'duration', label: 'Shortest first' },
    { value: '-duration', label: 'Longest first' },
    { value: '-createdAt', label: 'Newest' }
];

const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds "/?a=1&b=2" from the non-empty values
const buildUrl = params => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') qs.set(key, value);
    });
    const str = qs.toString();
    return str ? `/?${str}` : '/';
};

// Pages that need a logged-in user send visitors to the login page first
exports.requireLogin = (req, res, next) => {
    if (!res.locals.user) {
        return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
    }
    next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
    // only accept the filters this page offers
    const filters = {
        search: typeof req.query.search === 'string' ? req.query.search.trim() : '',
        difficulty: DIFFICULTIES.includes(req.query.difficulty) ? req.query.difficulty : '',
        maxPrice: Number(req.query.maxPrice) > 0 ? Number(req.query.maxPrice) : '',
        sort: SORT_OPTIONS.some(o => o.value === req.query.sort) ? req.query.sort : SORT_OPTIONS[0].value
    };
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const queryString = { sort: filters.sort, page, limit: PAGE_SIZE };
    if (filters.difficulty) queryString.difficulty = filters.difficulty;
    if (filters.maxPrice) queryString.price = { lte: filters.maxPrice };

    const baseFilter = filters.search ? { name: { $regex: escapeRegex(filters.search), $options: 'i' } } : {};
    const features = new APIfeatures(Tour.find(baseFilter), queryString).filter().sort().pagination();

    const [tours, total] = await Promise.all([
        features.query,
        Tour.countDocuments({ ...features.query.getFilter(), secretTour: { $ne: true } })
    ]);
    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

    const { sort, ...rest } = filters;
    const linkParams = { ...rest, sort: sort === SORT_OPTIONS[0].value ? '' : sort };

    res.status(200).render('overview', {
        title: 'All tours',
        tours,
        total,
        filters,
        sortOptions: SORT_OPTIONS,
        difficulties: DIFFICULTIES,
        hasFilters: Boolean(filters.search || filters.difficulty || filters.maxPrice || req.query.sort),
        pagination: {
            page,
            totalPages,
            pages: Array.from({ length: totalPages }, (_, i) => ({ number: i + 1, url: buildUrl({ ...linkParams, page: i + 1 }) })),
            prevUrl: page > 1 ? buildUrl({ ...linkParams, page: page - 1 }) : null,
            nextUrl: page < totalPages ? buildUrl({ ...linkParams, page: page + 1 }) : null
        }
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const populateReviews = { path: 'reviews', options: { sort: { createdAt: -1 } } };

    let tour = await Tour.findOne({ slug }).populate(populateReviews);
    // tours created before slugs existed are reachable by id
    if (!tour && /^[a-f0-9]{24}$/i.test(slug)) {
        tour = await Tour.findById(slug).populate(populateReviews);
    }
    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404));
    }

    const user = res.locals.user;
    const userReview = user
        ? tour.reviews.find(r => r.user && String(r.user._id) === String(user._id))
        : null;

    res.status(200).render('tour', {
        title: tour.name,
        tour,
        userReview,
        canReview: Boolean(user && user.role === 'user' && !userReview)
    });
});

exports.getNearPage = (req, res) => {
    res.status(200).render('near', { title: 'Tours near you' });
};

exports.getLoginForm = (req, res) => {
    if (res.locals.user) return res.redirect('/');
    res.status(200).render('login', { title: 'Log in' });
};

exports.getSignupForm = (req, res) => {
    if (res.locals.user) return res.redirect('/');
    res.status(200).render('signup', { title: 'Sign up' });
};

exports.getForgotPasswordForm = (req, res) => {
    res.status(200).render('forgotPassword', { title: 'Forgot password' });
};

exports.getResetPasswordForm = (req, res) => {
    res.status(200).render('resetPassword', { title: 'Reset password', token: req.params.token });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', { title: 'Your account' });
};

exports.getMyReviews = catchAsync(async (req, res, next) => {
    const reviews = await Review.find({ user: res.locals.user._id })
        .populate({ path: 'tour', select: 'name slug' })
        .sort('-createdAt');

    res.status(200).render('myReviews', { title: 'My reviews', reviews });
});

// ADMIN PAGES

exports.getAdminTours = catchAsync(async (req, res, next) => {
    const tours = await Tour.find().sort('name');
    res.status(200).render('admin/tours', { title: 'Manage tours', active: 'tours', tours });
});

const getGuides = () => User.find({ role: { $in: ['guide', 'lead-guide'] } }).sort('name');

exports.getNewTourForm = catchAsync(async (req, res, next) => {
    const guides = await getGuides();
    res.status(200).render('admin/tourForm', { title: 'New tour', active: 'tours', tour: null, guides });
});

exports.getEditTourForm = catchAsync(async (req, res, next) => {
    const [tour, guides] = await Promise.all([Tour.findById(req.params.id), getGuides()]);
    if (!tour) {
        return next(new AppError('there is no tour with this ID', 404));
    }
    res.status(200).render('admin/tourForm', { title: `Edit ${tour.name}`, active: 'tours', tour, guides });
});

exports.getAdminUsers = catchAsync(async (req, res, next) => {
    const users = await User.find().sort('name');
    res.status(200).render('admin/users', { title: 'Manage users', active: 'users', users });
});

exports.getAdminReviews = catchAsync(async (req, res, next) => {
    const reviews = await Review.find()
        .populate({ path: 'tour', select: 'name slug' })
        .sort('-createdAt');
    res.status(200).render('admin/reviews', { title: 'Manage reviews', active: 'reviews', reviews });
});

exports.getAdminStats = catchAsync(async (req, res, next) => {
    const currentYear = new Date().getFullYear();
    const requested = parseInt(req.query.year, 10);
    const year = requested >= 1970 && requested <= 2100 ? requested : currentYear;

    const [stats, plan] = await Promise.all([Tour.getStats(), Tour.getMonthlyPlan(year)]);
    res.status(200).render('admin/stats', { title: 'Tour statistics', active: 'stats', stats, plan, year });
});
