const pool = require('../config/db');

// ── GET /api/analytics/user-progress ──────────
exports.getUserProgress = async (req, res) => {
    try {
        const userID = req.user.userID;

        const [rows] = await pool.query(`
            SELECT COUNT(DISTINCT moduleID) as completedModules
            FROM QuizResult
            WHERE userID = ?
        `, [userID]);

        const completedModules = rows[0].completedModules || 0;
        return res.status(200).json({ completedModules });
    } catch (error) {
        console.error('getUserProgress error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── GET /api/analytics/user/:userID/category/:category/attempts ──────────
exports.getAttemptsByCategory = async (req, res) => {
    try {
        const { userID, category } = req.params;
        const decodedCategory = decodeURIComponent(category);
        const reqUser = req.user;

        // PBAC check: Teachers/Admins can view anyone. Students can only view themselves.
        if (reqUser.role === 'student' && parseInt(userID) !== reqUser.userID) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own history.' });
        }

        const [attempts] = await pool.query(`
            SELECT qr.resultID, qr.score, qr.dateTaken, m.title as moduleTitle
            FROM QuizResult qr
            JOIN Module m ON qr.moduleID = m.moduleID
            WHERE qr.userID = ? AND m.category = ?
            ORDER BY qr.dateTaken DESC
        `, [userID, decodedCategory]);

        return res.status(200).json(attempts);
    } catch (error) {
        console.error('getAttemptsByCategory error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── GET /api/analytics/attempt/:resultId ──────────
exports.getAttemptDetails = async (req, res) => {
    try {
        const { resultId } = req.params;
        const reqUser = req.user;

        // Fetch ownership first to enforce PBAC
        const [ownershipCheck] = await pool.query('SELECT userID FROM QuizResult WHERE resultID = ?', [resultId]);
        
        if (ownershipCheck.length === 0) {
            return res.status(404).json({ message: 'Quiz attempt not found.' });
        }

        const attemptOwnerID = ownershipCheck[0].userID;

        if (reqUser.role === 'student' && attemptOwnerID !== reqUser.userID) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own history.' });
        }

        const [details] = await pool.query(`
            SELECT qa.answerID, qa.selectedOption, qa.isCorrect, qq.questionText, qq.correctAnswer
            FROM QuizAnswer qa
            JOIN QuizQuestion qq ON qa.questionID = qq.questionID
            WHERE qa.resultID = ?
        `, [resultId]);

        return res.status(200).json(details);
    } catch (error) {
        console.error('getAttemptDetails error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
