// ──────────────────────────────────────────────
//  Leaderboard Controller — XP Rankings
// ──────────────────────────────────────────────

const pool = require('../config/db');

// ── GET /api/leaderboard ─────────────────────
// Returns the top users ranked by XP (descending).
exports.getLeaderboard = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.userID, u.username, u.level, u.xp, u.className, u.formLevel, u.schoolID, s.schoolName 
             FROM user u 
             LEFT JOIN School s ON u.schoolID = s.schoolID 
             WHERE u.role = 'student'
             ORDER BY u.xp DESC LIMIT 200`
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
