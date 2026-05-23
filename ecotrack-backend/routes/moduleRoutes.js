// ──────────────────────────────────────────────
//  Module Routes — /api/modules
//  All routes are protected by authMiddleware.
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const moduleController = require('../controllers/moduleController');

// Apply auth middleware to every route in this router
router.use(authMiddleware);

// GET /api/modules          → list all modules
router.get('/', authorize(['student', 'teacher', 'admin']), moduleController.getAllModules);

// GET /api/modules/:id      → single module detail
router.get('/:id', authorize(['student', 'teacher', 'admin']), moduleController.getModuleById);

// GET /api/modules/:id/quiz → quiz questions (no correctAnswer!)
router.get('/:id/quiz', authorize(['student', 'teacher', 'admin']), moduleController.getQuizForModule);

// POST /api/modules         → create new module
router.post('/', authorize(['teacher', 'admin']), moduleController.createModule);

// PUT /api/modules/:id      → update an existing module
router.put('/:id', authorize(['teacher', 'admin']), moduleController.updateModule);

// DELETE /api/modules/:id   → delete a module
router.delete('/:id', authorize(['teacher', 'admin']), moduleController.deleteModule);

// GET /api/modules/:id/questions → teacher quiz management
router.get('/:id/questions', authorize(['teacher', 'admin']), moduleController.getQuestionsForModule);

// POST /api/modules/:id/questions → add new question
router.post('/:id/questions', authorize(['teacher', 'admin']), moduleController.createQuestion);

// PUT /api/modules/questions/:questionId → update a question
router.put('/questions/:questionId', authorize(['teacher', 'admin']), moduleController.updateQuestion);

// DELETE /api/modules/questions/:questionId → delete a question
router.delete('/questions/:questionId', authorize(['teacher', 'admin']), moduleController.deleteQuestion);

module.exports = router;
