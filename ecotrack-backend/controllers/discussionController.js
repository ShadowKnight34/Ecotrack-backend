// ──────────────────────────────────────────────
//  Discussion Controller — Forum Feature
// ──────────────────────────────────────────────

const pool = require('../config/db');

// ── GET /api/discussions ──────────────────────
// Fetches all posts and joins with the User table
exports.getAllDiscussions = async (req, res) => {
    try {
        const { formLevel } = req.query;

        let query = `
            SELECT d.*, u.username, u.formLevel, u.role
            FROM Discussion d 
            JOIN user u ON d.userID = u.userID
        `;
        const params = [];

        if (formLevel) {
            query += ` WHERE u.formLevel = ? OR u.role != 'student'`;
            params.push(formLevel);
        }

        query += ` ORDER BY d.createdAt DESC`;

        const [rows] = await pool.query(query, params);

        return res.status(200).json(rows);
    } catch (error) {
        console.error('getAllDiscussions error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch discussions.',
        });
    }
};

// ── POST /api/discussions ─────────────────────
// Saves a new post linked to the logged-in user
exports.createDiscussion = async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const userID = req.user.userID; // Available via authMiddleware

        if (!title || !content || !category) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'title, content, and category are required.',
            });
        }

        const query = `
            INSERT INTO Discussion (userID, title, content, sdgCategory) 
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [userID, title, content, category]);

        return res.status(201).json({
            message: 'Discussion created successfully.',
            discussionID: result.insertId,
            title,
            content,
            category,
            userID
        });
    } catch (error) {
        console.error('createDiscussion error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create discussion.',
        });
    }
};

// ── DELETE /api/discussions/:id ────────────────
// Deletes a post if the user is the owner or a teacher
exports.deleteDiscussion = async (req, res) => {
    try {
        const { id } = req.params;
        const userID = req.user.userID;
        const userRole = req.user.role;

        // Verify existence and ownership
        const [rows] = await pool.query('SELECT userID FROM discussion WHERE postID = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Discussion not found.' });
        }
        
        const discussionOwner = rows[0].userID;
        
        if (discussionOwner !== userID && userRole !== 'teacher' && userRole !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. You do not have permission to delete this post.' });
        }
        
        await pool.query('DELETE FROM discussion WHERE postID = ?', [id]);
        return res.status(200).json({ message: 'Discussion deleted successfully.' });
    } catch (error) {
        console.error('deleteDiscussion error:', error.message);
        return res.status(500).json({ message: 'Failed to delete discussion.' });
    }
};
