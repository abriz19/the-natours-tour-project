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
router.patch('/updatePassword', authController.blockDemo(), authController.updatePassword);
router.patch('/updateMe', authController.blockDemo(), userController.updateMe);
router.delete('/deleteMe', authController.blockDemo(), userController.deleteMe);
router.get('/me', userController.getMe);

router.use(authController.restrict('admin'));
router
.route('/')
.get(userController.getAllUsers)
.post(authController.blockDemo(), userController.createUser);


router
.route('/:id')
.get(userController.getSingleUser)
.patch(authController.blockDemo(), userController.updatedUser)
.delete(authController.blockDemo(), userController.deleteUser);


module.exports = router;
