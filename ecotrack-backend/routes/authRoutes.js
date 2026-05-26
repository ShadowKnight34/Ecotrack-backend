const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// ❌ DELETE OR COMMENT OUT THIS LINE:
// router.use(authMiddleware); 

// These must stay PUBLIC so users can actually get a token
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);

// Protected route to fetch current user's stats
router.get('/me', authMiddleware, authController.getMe);

// Protected route to update profile
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;