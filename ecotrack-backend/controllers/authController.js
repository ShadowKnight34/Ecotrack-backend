// ──────────────────────────────────────────────
//  Auth Controller — Register & Login
// ──────────────────────────────────────────────

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const SALT_ROUNDS = 10;

// ── POST /api/auth/register ──────────────────
exports.register = async (req, res) => {
    try {
        const { username, email, password, className, role, adminInviteKey, schoolID, schoolName, formLevel } = req.body;

        // Security Guardrail: Validate role schema
        const validRoles = ['student', 'teacher', 'admin'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ error: 'Bad Request', message: 'Invalid role provided.' });
        }

        // Security Guardrail: Enforce admin-invite-key
        if (role === 'admin') {
            const key = adminInviteKey || req.headers['x-admin-invite-key'];
            if (!process.env.ADMIN_INVITE_KEY || key !== process.env.ADMIN_INVITE_KEY) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Invalid or missing admin invite key.',
                });
            }
        }

        // Defensive Coding: Role-based logic to handle different user types during registration.
        // If the user is a teacher or admin, they don't need a class name. If they are a student, it is strictly required.
        const userRole = role || 'student';

        // 1 ── Validate input (Conditional based on role)
        if (!username || !email || !password || (userRole === 'student' && !className)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: userRole === 'student' 
                    ? 'username, email, password, and className are required for students.' 
                    : 'username, email, and password are required.',
            });
        }

        // 2 ── Check if email already exists
        const [existing] = await pool.query(
            'SELECT userID FROM User WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'An account with this email already exists.',
            });
        }

        // 3 ── Hash the password
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // 4 ── Handle schoolName / schoolID
        let finalSchoolID = schoolID || null;
        if (schoolName && !finalSchoolID) {
            const [schoolRows] = await pool.query('SELECT schoolID FROM School WHERE schoolName = ?', [schoolName]);
            if (schoolRows.length > 0) {
                finalSchoolID = schoolRows[0].schoolID;
            } else {
                const code = schoolName.replace(/\s+/g, '').toUpperCase().substring(0, 5) + '-' + Math.floor(Math.random() * 1000);
                const [insertSchool] = await pool.query('INSERT INTO School (schoolName, schoolCode) VALUES (?, ?)', [schoolName, code]);
                finalSchoolID = insertSchool.insertId;
            }
        }

        // 5 ── Insert new user (default level = 1, xp = 0)
        const finalClassName = className || null;

        const [result] = await pool.query(
            'INSERT INTO User (username, email, password, level, xp, className, role, schoolID, formLevel) VALUES (?, ?, ?, 1, 0, ?, ?, ?, ?)',
            [username, email, hashedPassword, finalClassName, userRole, finalSchoolID, formLevel || null]
        );

        return res.status(201).json({
            message: 'User registered successfully.',
            userId: result.insertId,
        });
    } catch (error) {
        console.error('Register error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Something went wrong during registration.',
        });
    }
};

// ── POST /api/auth/login ─────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1 ── Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'email and password are required.',
            });
        }

        // 2 ── Find user by email
        const [rows] = await pool.query(
            'SELECT * FROM User WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password.',
            });
        }

        const user = rows[0];

        // 3 ── Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password.',
            });
        }

        // 4 ── Generate JWT (payload: userID + level + role)
        const token = jwt.sign(
            { userID: user.userID, level: user.level, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5 ── Return token + user info (exclude password)
        const { password: _, ...userInfo } = user;

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: userInfo,
        });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Something went wrong during login.',
        });
    }
};

// ── GET /api/auth/me ──────────────────────────
exports.getMe = async (req, res) => {
    try {
        const userID = req.user.userID;
        const [userRows] = await pool.query(
            `SELECT u.userID, u.username, u.email, u.level, u.xp, u.role, u.className, u.formLevel, u.schoolID, s.schoolName 
             FROM User u 
             LEFT JOIN School s ON u.schoolID = s.schoolID 
             WHERE u.userID = ?`,
            [userID]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = userRows[0];

        // Fetch quiz stats
        const [quizRows] = await pool.query(
            'SELECT COUNT(*) as quizCount, AVG(score) as avgScore FROM QuizResult WHERE userID = ?',
            [userID]
        );
        const quizCount = quizRows[0]?.quizCount || 0;
        const avgScore = quizRows[0]?.avgScore ? Math.round(quizRows[0].avgScore) : 0;

        // Fetch user badges
        const [badgeRows] = await pool.query(
            'SELECT badgeID FROM UserBadge WHERE userID = ?',
            [userID]
        );
        const earnedBadges = badgeRows.map(row => row.badgeID);

        // Fetch classes for teacher role
        let classes = [];
        if (user.role === 'teacher') {
            const [classRows] = await pool.query(
                'SELECT className FROM teacher_classes WHERE teacherId = ?',
                [userID]
            );
            classes = classRows.map(row => row.className);
        }

        return res.status(200).json({
            ...user,
            classes,
            quizCount,
            avgScore,
            earnedBadges,
        });

    } catch (error) {
        console.error('getMe error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch user data.' });
    }
};

// ── PUT /api/auth/profile ─────────────────────
exports.updateProfile = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const userID = req.user.userID;

        // Fetch current user details from DB to know role and schoolID
        const [userRows] = await connection.query('SELECT role, schoolID FROM User WHERE userID = ?', [userID]);
        if (userRows.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'User not found.' });
        }
        const userRole = userRows[0].role;

        if (userRole === 'teacher') {
            const { schoolName, classes } = req.body;

            // Resolve school ID
            let resolvedSchoolID = null;
            if (schoolName !== undefined) {
                if (schoolName && schoolName.trim()) {
                    const trimmedSchoolName = schoolName.trim();
                    const [schoolRows] = await connection.query(
                        'SELECT schoolID FROM School WHERE LOWER(schoolName) = LOWER(?)',
                        [trimmedSchoolName]
                    );
                    if (schoolRows.length > 0) {
                        resolvedSchoolID = schoolRows[0].schoolID;
                    } else {
                        const code = trimmedSchoolName.replace(/\s+/g, '').toUpperCase().substring(0, 5) + '-' + Math.floor(Math.random() * 1000);
                        const [insertSchool] = await connection.query(
                            'INSERT INTO School (schoolName, schoolCode) VALUES (?, ?)',
                            [trimmedSchoolName, code]
                        );
                        resolvedSchoolID = insertSchool.insertId;
                    }
                } else {
                    resolvedSchoolID = null;
                }
            } else {
                resolvedSchoolID = userRows[0].schoolID;
            }

            // Update teacher's schoolID in User table
            await connection.query(
                'UPDATE User SET schoolID = ? WHERE userID = ?',
                [resolvedSchoolID, userID]
            );

            // Delete existing classes for this teacher
            await connection.query(
                'DELETE FROM teacher_classes WHERE teacherId = ?',
                [userID]
            );

            // If classes array has items, batch insert them
            if (classes && Array.isArray(classes) && classes.length > 0) {
                const values = classes.map(clsName => [userID, clsName]);
                await connection.query(
                    'INSERT INTO teacher_classes (teacherId, className) VALUES ?',
                    [values]
                );
            }

            await connection.commit();
            return res.status(200).json({ message: 'Profile updated successfully.' });

        } else {
            // Student / Admin path
            const { className, formLevel, schoolName } = req.body;

            if (!className) {
                await connection.rollback();
                return res.status(400).json({ message: 'className is required.' });
            }

            // Resolve school ID
            let resolvedSchoolID = null;
            if (schoolName !== undefined) {
                if (schoolName && schoolName.trim()) {
                    const trimmedSchoolName = schoolName.trim();
                    const [schoolRows] = await connection.query(
                        'SELECT schoolID FROM School WHERE LOWER(schoolName) = LOWER(?)',
                        [trimmedSchoolName]
                    );
                    if (schoolRows.length > 0) {
                        resolvedSchoolID = schoolRows[0].schoolID;
                    } else {
                        const code = trimmedSchoolName.replace(/\s+/g, '').toUpperCase().substring(0, 5) + '-' + Math.floor(Math.random() * 1000);
                        const [insertSchool] = await connection.query(
                            'INSERT INTO School (schoolName, schoolCode) VALUES (?, ?)',
                            [trimmedSchoolName, code]
                        );
                        resolvedSchoolID = insertSchool.insertId;
                    }
                } else {
                    resolvedSchoolID = null;
                }
            } else {
                resolvedSchoolID = userRows[0].schoolID;
            }

            await connection.query(
                'UPDATE User SET className = ?, formLevel = ?, schoolID = ? WHERE userID = ?',
                [className, formLevel || null, resolvedSchoolID, userID]
            );

            await connection.commit();
            return res.status(200).json({ message: 'Profile updated successfully.' });
        }
    } catch (error) {
        await connection.rollback();
        console.error('updateProfile error:', error.message);
        return res.status(500).json({ message: 'Failed to update profile.' });
    } finally {
        connection.release();
    }
};

