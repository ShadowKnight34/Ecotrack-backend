// ──────────────────────────────────────────────
//  Teacher Controller — Dashboard Stats
// ──────────────────────────────────────────────

const pool = require('../config/db');

// ── GET /api/teacher/dashboard-stats ──────────
exports.getDashboardStats = async (req, res) => {
    try {
        // Only teachers and admins should access this
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Teachers only.' });
        }

        // Fetch logged-in user's schoolID
        const [teacherRows] = await pool.query(
            "SELECT schoolID FROM user WHERE userID = ?",
            [req.user.userID]
        );
        const schoolID = teacherRows[0]?.schoolID;

        let schoolCondition = "";
        const schoolParams = [];
        if (schoolID !== undefined && schoolID !== null) {
            schoolCondition = " AND u.schoolID = ?";
            schoolParams.push(schoolID);
        }

        const { className, form } = req.query;
        let classCondition = "";
        const params = [];
        
        if (schoolID !== undefined && schoolID !== null) {
            classCondition += " AND u.schoolID = ?";
            params.push(schoolID);
        }

        // Apply monitored classes filter if role is teacher
        if (req.user.role === 'teacher') {
            if (className && className !== 'All Classes') {
                classCondition += " AND u.className = ? AND u.className IN (SELECT className FROM teacher_classes WHERE teacherId = ?)";
                params.push(className, req.user.userID);
            } else {
                classCondition += " AND u.className IN (SELECT className FROM teacher_classes WHERE teacherId = ?)";
                params.push(req.user.userID);
            }
        } else {
            // For admins (or other roles)
            if (className && className !== 'All Classes') {
                classCondition += " AND u.className = ?";
                params.push(className);
            }
        }

        if (form && form !== 'All Forms') {
            classCondition += " AND u.formLevel = ?";
            params.push(form);
        }

        // 1. Available Classes
        let availableClasses = [];
        if (req.user.role === 'teacher') {
            const [classRows] = await pool.query(
                `SELECT DISTINCT className FROM teacher_classes WHERE teacherId = ?`,
                [req.user.userID]
            );
            availableClasses = ['All Classes', ...classRows.map(r => r.className)];
        } else {
            const [classRows] = await pool.query(
                `SELECT DISTINCT className FROM user u WHERE u.role = 'student' AND u.className IS NOT NULL${schoolCondition}`,
                schoolParams
            );
            availableClasses = ['All Classes', ...classRows.map(r => r.className)];
        }

        // 2. Total Student Count
        const [studentRows] = await pool.query(
            `SELECT COUNT(*) as totalStudents FROM user u WHERE u.role = 'student' ${classCondition}`,
            params
        );
        const totalStudents = studentRows[0].totalStudents;

        // 3. Average Score grouped by Module Category
        const [categoryRows] = await pool.query(`
            SELECT m.category, AVG(qr.score) as avgScore, COUNT(qr.resultID) as totalAttempts
            FROM QuizResult qr
            JOIN Module m ON qr.moduleID = m.moduleID
            JOIN user u ON qr.userID = u.userID
            WHERE u.role = 'student' ${classCondition}
            GROUP BY m.category
        `, params);

        // 4. Average Score grouped by Module ID for line chart
        const [moduleRows] = await pool.query(`
            SELECT m.moduleID, AVG(qr.score) as avgScore, COUNT(qr.resultID) as totalAttempts
            FROM QuizResult qr
            JOIN Module m ON qr.moduleID = m.moduleID
            JOIN user u ON qr.userID = u.userID
            WHERE u.role = 'student' ${classCondition}
            GROUP BY m.moduleID
        `, params);

        // Calculate a global average score
        let overallAvgScore = 0;
        if (categoryRows.length > 0) {
            const sum = categoryRows.reduce((acc, row) => acc + parseFloat(row.avgScore || 0), 0);
            overallAvgScore = Math.round(sum / categoryRows.length);
        }

        // 5. Difficulty Tier Breakdown
        const [difficultyRows] = await pool.query(`
            SELECT q.difficultyLevel, COUNT(qr.resultID) as totalAttempts, AVG(qr.score) as avgScore
            FROM QuizResult qr
            JOIN (
                SELECT DISTINCT qa.resultID, qq.difficultyLevel
                FROM QuizAnswer qa
                JOIN QuizQuestion qq ON qa.questionID = qq.questionID
            ) q ON qr.resultID = q.resultID
            JOIN user u ON qr.userID = u.userID
            WHERE u.role = 'student' ${classCondition}
            GROUP BY q.difficultyLevel
        `, params);

        return res.status(200).json({
            availableClasses,
            totalStudents,
            overallAvgScore,
            categoryBreakdown: categoryRows.map(row => ({
                category: row.category,
                avgScore: Math.round(parseFloat(row.avgScore || 0)),
                totalAttempts: row.totalAttempts || 0
            })),
            moduleBreakdown: moduleRows.map(row => ({
                moduleCode: `M${String(row.moduleID).padStart(2, '0')}`,
                avgScore: Math.round(parseFloat(row.avgScore || 0)),
                totalAttempts: row.totalAttempts || 0
            })),
            difficultyBreakdown: difficultyRows.map(row => ({
                tier: row.difficultyLevel === 1 ? 'Foundation' : row.difficultyLevel === 2 ? 'Intermediate' : 'Advanced',
                avgScore: Math.round(parseFloat(row.avgScore || 0)),
                totalAttempts: row.totalAttempts || 0
            }))
        });

    } catch (error) {
        console.error('getDashboardStats error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve dashboard stats.',
        });
    }
};

// ── GET /api/teacher/students ──────────
exports.getStudentsList = async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const [students] = await pool.query(
            `SELECT 
                u.userID AS userID, 
                u.username AS username, 
                u.className AS className, 
                s.schoolName AS schoolName, 
                qr.score AS score, 
                qr.dateTaken AS dateTaken,
                u.level AS level,
                u.xp AS xp
             FROM User u
             LEFT JOIN School s ON u.schoolID = s.schoolID
             LEFT JOIN QuizResult qr ON u.userID = qr.userID
             WHERE u.role = 'student' 
             ORDER BY u.className, u.username`
        );
        return res.status(200).json(students);
    } catch (error) {
        console.error('getStudentsList error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// ── GET /api/teacher/students/:studentId/report ──────────
exports.getStudentReport = async (req, res) => {
    try {
        const { studentId } = req.params;

        const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';
        const isSelf = req.user.role === 'student' && String(req.user.userID) === String(studentId);

        if (!isTeacherOrAdmin && !isSelf) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        console.log(`[StudentReport Pipeline] Received studentId parameter:`, studentId);

        const [studentCheck] = await pool.query("SELECT username FROM user WHERE userID = ? AND role = 'student'", [studentId]);
        if (studentCheck.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const query = `
            SELECT m.category, MAX(qr.score) as bestScore, COUNT(qr.resultID) as totalAttempts
            FROM Module m
            LEFT JOIN QuizResult qr ON m.moduleID = qr.moduleID AND qr.userID = ?
            GROUP BY m.category
        `;

        const moduleQuery = `
            SELECT m.moduleID, MAX(qr.score) as bestScore, COUNT(qr.resultID) as totalAttempts
            FROM Module m
            LEFT JOIN QuizResult qr ON m.moduleID = qr.moduleID AND qr.userID = ?
            GROUP BY m.moduleID
        `;

        console.log('[StudentReport SQL Verification]:', query);

        const [report] = await pool.query(query, [studentId]);
        const [moduleReportRows] = await pool.query(moduleQuery, [studentId]);

        const difficultyQuery = `
            SELECT q.difficultyLevel, COUNT(qr.resultID) as totalAttempts, MAX(qr.score) as bestScore
            FROM QuizResult qr
            JOIN (
                SELECT DISTINCT qa.resultID, qq.difficultyLevel
                FROM QuizAnswer qa
                JOIN QuizQuestion qq ON qa.questionID = qq.questionID
            ) q ON qr.resultID = q.resultID
            WHERE qr.userID = ?
            GROUP BY q.difficultyLevel
        `;
        const [difficultyReportRows] = await pool.query(difficultyQuery, [studentId]);

        const responseData = {
            student: studentCheck[0],
            report: report.map(r => ({
                category: r.category,
                bestScore: r.bestScore || 0,
                totalAttempts: r.totalAttempts || 0
            })),
            moduleReport: moduleReportRows.map(r => ({
                moduleCode: `M${String(r.moduleID).padStart(2, '0')}`,
                bestScore: r.bestScore || 0,
                totalAttempts: r.totalAttempts || 0
            })),
            difficultyReport: difficultyReportRows.map(r => ({
                tier: r.difficultyLevel === 1 ? 'Foundation' : r.difficultyLevel === 2 ? 'Intermediate' : 'Advanced',
                bestScore: r.bestScore || 0,
                totalAttempts: r.totalAttempts || 0
            }))
        };
        
        console.log('[Backend Data Bridge] Sending Response:', JSON.stringify(responseData, null, 2));
        return res.status(200).json(responseData);
    } catch (error) {
        console.error('getStudentReport error:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
