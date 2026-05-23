// ──────────────────────────────────────────────
//  Discussion Routes — /api/discussions
//  All routes are protected by authMiddleware.
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const discussionController = require('../controllers/discussionController');

// Apply auth middleware to every route in this router
router.use(authMiddleware);

// GET /api/discussions  → list all discussions
router.get('/', discussionController.getAllDiscussions);

// POST /api/discussions → create a new discussion
router.post('/', discussionController.createDiscussion);

// DELETE /api/discussions/:id → delete a discussion
router.delete('/:id', discussionController.deleteDiscussion);

module.exports = router;
