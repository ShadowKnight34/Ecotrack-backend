const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/user-progress', analyticsController.getUserProgress);
router.get('/user/:userID/category/:category/attempts', analyticsController.getAttemptsByCategory);
router.get('/attempt/:resultId', analyticsController.getAttemptDetails);

module.exports = router;
