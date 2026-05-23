const pool = require('../config/db');

// ── GET /api/schools ──────────────────────────
exports.getSchools = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT schoolID, schoolName, schoolCode FROM School');
        return res.status(200).json(rows);
    } catch (error) {
        console.error('getSchools error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch schools list.',
        });
    }
};
