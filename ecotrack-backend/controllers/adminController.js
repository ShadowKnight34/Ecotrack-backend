const pool = require('../config/db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// ── GET /api/admin/dashboard-stats ─────────────
exports.getDashboardStats = async (req, res) => {
    try {
        const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) AS totalUsers FROM user');
        const [[{ totalModules }]] = await pool.query('SELECT COUNT(*) AS totalModules FROM module');
        const [[{ activeQuizzes }]] = await pool.query('SELECT COUNT(DISTINCT moduleID) AS activeQuizzes FROM QuizQuestion');

        return res.status(200).json({
            totalUsers,
            totalModules,
            activeQuizzes
        });
    } catch (error) {
        console.error('getDashboardStats error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
};

// ── GET /api/admin/users ───────────────────────
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT userID, username, email, level, xp, role, className FROM user ORDER BY userID DESC'
        );
        return res.status(200).json(users);
    } catch (error) {
        console.error('getAllUsers error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch users' });
    }
};

// ── PUT /api/admin/users/:id/role ──────────────
exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['student', 'teacher', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        await pool.query('UPDATE user SET role = ? WHERE userID = ?', [role, id]);
        return res.status(200).json({ message: 'User role updated successfully' });
    } catch (error) {
        console.error('updateUserRole error:', error.message);
        return res.status(500).json({ message: 'Failed to update user role' });
    }
};

// ── DELETE /api/admin/users/:id ────────────────
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Basic protection so admin doesn't delete themselves
        if (parseInt(id) === req.user.userID) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        await pool.query('DELETE FROM user WHERE userID = ?', [id]);
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('deleteUser error:', error.message);
        return res.status(500).json({ message: 'Failed to delete user' });
    }
};

// ── POST /api/admin/users/import ────────────────
exports.importUsers = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const inputUsers = Array.isArray(req.body) ? req.body : req.body?.users;
        if (!Array.isArray(inputUsers)) {
            return res.status(400).json({ error: 'Bad Request', message: 'Input must be an array of users.' });
        }

        const validationErrors = [];
        const basicValidUsers = [];
        const seenEmails = new Set();

        // 1 ── Basic format & required field validation
        for (let i = 0; i < inputUsers.length; i++) {
            const user = inputUsers[i];
            const rowNum = i + 2; // Assuming row 1 is header
            
            const username = user.username?.toString().trim();
            const email = user.email?.toString().trim().toLowerCase();
            const password = user.password?.toString().trim();
            const className = user.className?.toString().trim();
            const schoolName = user.schoolName?.toString().trim();
            const formLevel = user.formLevel;

            if (!username) {
                validationErrors.push({ row: rowNum, email: email || 'N/A', error: 'Username is required.' });
                continue;
            }
            if (!email) {
                validationErrors.push({ row: rowNum, email: 'N/A', error: 'Email is required.' });
                continue;
            }
            // Simple email validation regex
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                validationErrors.push({ row: rowNum, email, error: 'Invalid email format.' });
                continue;
            }
            if (!password) {
                validationErrors.push({ row: rowNum, email, error: 'Password is required.' });
                continue;
            }
            if (!className) {
                validationErrors.push({ row: rowNum, email, error: 'Class name is required for students.' });
                continue;
            }

            // Check for duplicates in the current import list
            if (seenEmails.has(email)) {
                validationErrors.push({ row: rowNum, email, error: 'Duplicate email in the import list.' });
                continue;
            }
            seenEmails.add(email);

            basicValidUsers.push({
                rowNum,
                username,
                email,
                password,
                className,
                schoolName,
                formLevel
            });
        }

        // 2 ── Check if any email already exists in the database
        const emailsToCheck = basicValidUsers.map(u => u.email);
        const existingEmails = new Set();

        if (emailsToCheck.length > 0) {
            const [rows] = await conn.query('SELECT email FROM user WHERE email IN (?)', [emailsToCheck]);
            for (let row of rows) {
                existingEmails.add(row.email.toLowerCase());
            }
        }

        const validUsers = [];
        for (let user of basicValidUsers) {
            if (existingEmails.has(user.email)) {
                validationErrors.push({
                    row: user.rowNum,
                    email: user.email,
                    error: 'Email already exists in the database.'
                });
            } else {
                validUsers.push(user);
            }
        }

        // 3 ── If we have valid users, process and insert them
        if (validUsers.length > 0) {
            // A. Resolve School IDs
            const uniqueSchools = [...new Set(validUsers.map(u => u.schoolName).filter(Boolean))];
            const schoolMap = {};

            for (let sName of uniqueSchools) {
                const [schoolRows] = await conn.query('SELECT schoolID FROM School WHERE schoolName = ?', [sName]);
                if (schoolRows.length > 0) {
                    schoolMap[sName] = schoolRows[0].schoolID;
                } else {
                    const code = sName.replace(/\s+/g, '').toUpperCase().substring(0, 5) + '-' + Math.floor(Math.random() * 1000);
                    const [insertResult] = await conn.query('INSERT INTO School (schoolName, schoolCode) VALUES (?, ?)', [sName, code]);
                    schoolMap[sName] = insertResult.insertId;
                }
            }

            // B. Hash passwords and build values array for bulk insert
            const bulkValues = [];
            for (let user of validUsers) {
                const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
                const schoolID = user.schoolName ? schoolMap[user.schoolName] : null;
                
                bulkValues.push([
                    user.username,
                    'student', // default account role value is 'student'
                    user.email,
                    hashedPassword,
                    1, // level
                    0, // xp
                    user.className,
                    user.schoolName || '',
                    user.formLevel ? parseInt(user.formLevel) : null,
                    schoolID
                ]);
            }

            // C. Perform bulk database operation inside transaction
            await conn.query(
                'INSERT INTO user (username, role, email, password, level, xp, className, schoolName, formLevel, schoolID) VALUES ?',
                [bulkValues]
            );
        }

        await conn.commit();

        return res.status(200).json({
            summary: {
                totalCreated: validUsers.length,
                totalFailed: validationErrors.length
            },
            errors: validationErrors
        });

    } catch (error) {
        await conn.rollback();
        console.error('Import users transaction error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to import users.'
        });
    } finally {
        conn.release();
    }
};
