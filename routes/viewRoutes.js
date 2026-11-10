const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', authController.isloggedIn, viewsController.getOverview);
router.get('/tour/:slug', authController.isloggedIn, viewsController.getTour);
router.get('/login', authController.isloggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

module.exports = router;
