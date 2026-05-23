// ──────────────────────────────────────────────
//  Comment Routes — /api/comments
//  All routes are protected by authMiddleware.
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const commentController = require('../controllers/commentController');
const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Apply auth middleware
router.use(authMiddleware);

// GET /api/comments/:moduleID → list all comments for a module
router.get('/:moduleID', commentController.getCommentsByModule);

// POST /api/comments → create a new comment
router.post('/', upload.single('image'), commentController.createComment);

// DELETE /api/comments/:id → delete a comment
router.delete('/:id', commentController.deleteComment);

module.exports = router;
