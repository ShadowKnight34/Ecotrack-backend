// ──────────────────────────────────────────────
//  Teacher Routes — /api/teacher
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const teacherController = require('../controllers/teacherController');

// Apply auth middleware to every route in this router
router.use(authMiddleware);

// GET /api/teacher/dashboard-stats → returns teacher dashboard statistics
router.get('/dashboard-stats', teacherController.getDashboardStats);

// GET /api/teacher/students → returns list of all students
router.get('/students', teacherController.getStudentsList);

// GET /api/teacher/students/:studentId/report → returns student category performance
router.get('/students/:studentId/report', teacherController.getStudentReport);

module.exports = router;
