const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');



router.post('/signup', authController.signupUser);
router.post('/login', authController.loginUser);
router.get('/logout', authController.logout);
router.patch('/resetPassword/:token', authController.resetPassword);
router.post('/forgotPassword', authController.forgotPassword);

router.use(authController.protect);
router.patch('/updatePassword', authController.updatePassword);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.get('/me', userController.getMe);

router.use(authController.restrict('admin'));
router
.route('/')
.get(userController.getAllUsers)
.post(userController.createUser);


router
.route('/:id')
.get(userController.getSingleUser)
.patch(userController.updatedUser)
.delete(userController.deleteUser);


module.exports = router;
