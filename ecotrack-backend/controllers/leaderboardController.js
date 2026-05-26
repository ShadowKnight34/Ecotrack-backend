// ──────────────────────────────────────────────
//  Leaderboard Controller — XP Rankings
// ──────────────────────────────────────────────

const pool = require('../config/db');

// ── GET /api/leaderboard ─────────────────────
// Returns the top 50 users ranked by XP (descending).
exports.getLeaderboard = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT userID, username, level, xp, className FROM user ORDER BY xp DESC LIMIT 50'
        );

        return res.status(200).json(rows);
    } catch (error) {
        console.error('getLeaderboard error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve leaderboard.',
        });
    }
};
