const express = require('express');
const rateLimit = require('express-rate-limit');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  max: 5,
  windowMs: 60 * 60 * 1000,
  message: 'Too many login attempts, please try again in an hour!',
});

router.post('/signup', authController.signup);
router.post('/login', authLimiter, authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

//protect all routes after this middleware
router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/update-me',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/delete-me', userController.deleteMe);

//access only for admin
router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
