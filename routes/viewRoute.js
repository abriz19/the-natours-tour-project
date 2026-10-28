const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

// makes the logged-in user (if any) available to every page as `user`
router.use(authController.isLoggedIn);

router.get('/', viewController.getOverview);
router.get('/tour/:slug', viewController.getTour);
router.get('/near', viewController.getNearPage);

router.get('/login', viewController.getLoginForm);
router.get('/signup', viewController.getSignupForm);
router.get('/forgot-password', viewController.getForgotPasswordForm);
router.get('/reset-password/:token', viewController.getResetPasswordForm);

router.get('/me', viewController.requireLogin, viewController.getAccount);
router.get('/my-reviews', viewController.requireLogin, viewController.getMyReviews);

// admin area: admins and lead guides, user management is admin only
const staffOnly = [viewController.requireLogin, authController.restrict('admin', 'lead-guide')];
const adminOnly = [viewController.requireLogin, authController.restrict('admin')];

router.get('/admin', staffOnly, (req, res) => res.redirect('/admin/tours'));
router.get('/admin/tours', staffOnly, viewController.getAdminTours);
router.get('/admin/tours/new', staffOnly, viewController.getNewTourForm);
router.get('/admin/tours/:id/edit', staffOnly, viewController.getEditTourForm);
router.get('/admin/reviews', staffOnly, viewController.getAdminReviews);
router.get('/admin/stats', staffOnly, viewController.getAdminStats);
router.get('/admin/users', adminOnly, viewController.getAdminUsers);

module.exports = router;
