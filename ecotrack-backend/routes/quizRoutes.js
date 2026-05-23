// ──────────────────────────────────────────────
//  Quiz Routes — /api/quizzes
//  All routes are protected by authMiddleware.
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const quizController = require('../controllers/quizController');

// Apply auth middleware to every route in this router
router.use(authMiddleware);

// GET /api/quizzes/user-results → retrieve all quiz results for the logged-in user
router.get('/user-results', quizController.getUserResults);

// POST /api/quizzes/submit → grade and record a quiz attempt
router.post('/submit', quizController.submitQuiz);

module.exports = router;
