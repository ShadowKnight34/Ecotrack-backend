const pool = require('../config/db');

// ── GET /api/comments/:moduleID ───────────────
exports.getCommentsByModule = async (req, res) => {
    try {
        const { moduleID } = req.params;

        if (!moduleID) {
            return res.status(400).json({ message: 'moduleID is required.' });
        }

        // FIXED: Changed 'Comment c' to 'module_comments c' 
        // FIXED: Changed 'User u' to 'user u'
        const query = `
            SELECT c.*, u.username 
            FROM module_comments c 
            JOIN user u ON c.userID = u.userID 
            WHERE c.moduleID = ?
            ORDER BY c.createdAt DESC
        `;
        const [rows] = await pool.query(query, [moduleID]);

        return res.status(200).json(rows);
    } catch (error) {
        console.error('getCommentsByModule error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch comments.' });
    }
};

// ── POST /api/comments ────────────────────────
exports.createComment = async (req, res) => {
    try {
        const { moduleID, commentText } = req.body;
        const userID = req.user.userID;

        if (!moduleID || !commentText) {
            return res.status(400).json({
                message: 'moduleID and commentText are required.'
            });
        }

        let imageUrl = null;
        if (req.file) {
            const serverUrl = `${req.protocol}://${req.get('host')}`;
            imageUrl = `${serverUrl}/uploads/${req.file.filename}`;
        }

        const query = `
            INSERT INTO module_comments (userID, moduleID, commentText, image_url) 
            VALUES (?, ?, ?, ?)
        `;

        const [result] = await pool.query(query, [userID, moduleID, commentText, imageUrl]);

        return res.status(201).json({ message: 'Comment created successfully!' });
    } catch (error) {
        console.error('createComment error:', error.message);
        return res.status(500).json({ message: 'Failed to create comment.' });
    }
};

// ── DELETE /api/comments/:id ──────────────────
// Deletes a comment if the user is the owner or a teacher
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userID = req.user.userID;
        const userRole = req.user.role;

        // Verify existence and ownership
        const [rows] = await pool.query('SELECT userID FROM module_comments WHERE commentID = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Comment not found.' });
        }
        
        const commentOwner = rows[0].userID;
        
        if (commentOwner !== userID && userRole !== 'teacher' && userRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. You do not have permission to delete this comment.' });
        }
        
        await pool.query('DELETE FROM module_comments WHERE commentID = ?', [id]);
        return res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error('deleteComment error:', error.message);
        return res.status(500).json({ message: 'Failed to delete comment.' });
    }
};