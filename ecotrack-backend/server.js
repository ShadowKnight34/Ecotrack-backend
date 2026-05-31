// ──────────────────────────────────────────────
//  EcoTrack Backend — Entry Point
// ──────────────────────────────────────────────

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health-check route ───────────────────────
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: '🌿 EcoTrack API is running',
        timestamp: new Date().toISOString(),
    });
});

// ── Temporary Remote Migration Route ─────────
const pool = require('./config/db');
app.get('/api/migrate', async (req, res) => {
    try {
        console.log('Running migrations on remote TiDB Cloud database...');
        
        // 1. Create School Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS School (
                schoolID INT AUTO_INCREMENT PRIMARY KEY,
                schoolName VARCHAR(255) NOT NULL,
                schoolCode VARCHAR(50) UNIQUE NOT NULL
            );
        `);

        // 2. Add schoolID to User
        try {
            await pool.query('ALTER TABLE user ADD COLUMN schoolID INT;');
            console.log('Added schoolID column to User table.');
        } catch (colErr) {
            console.log('schoolID column might already exist, skipping.');
        }

        // 3. Add Foreign Key
        try {
            await pool.query('ALTER TABLE user ADD FOREIGN KEY (schoolID) REFERENCES School(schoolID) ON DELETE SET NULL;');
            console.log('Added Foreign Key to User table.');
        } catch (fkErr) {
            console.log('Foreign key constraint might already exist, skipping.');
        }

        // 4. Add formLevel to User
        try {
            await pool.query('ALTER TABLE user ADD COLUMN formLevel INT DEFAULT NULL;');
            console.log('Added formLevel column to User table.');
        } catch (flErr) {
            console.log('formLevel might already exist, skipping.');
        }

        // 5. Insert dummy schools
        await pool.query(`
            INSERT IGNORE INTO School (schoolName, schoolCode) VALUES 
            ('SMK Damansara Utama', 'SMKDU-01'),
            ('SK Bangsar', 'SKB-02'),
            ('SMK Bukit Bintang', 'SMKBB-03');
        `);

        return res.status(200).json({
            status: 'success',
            message: 'Database migrated successfully on TiDB Cloud!',
        });
    } catch (error) {
        console.error('Migration route error:', error.message);
        return res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
});

// ── Route mounting ───────────────────────────
const authRoutes = require('./routes/authRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const quizRoutes = require('./routes/quizRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const commentRoutes = require('./routes/commentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const adminRoutes = require('./routes/adminRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes'); // Adjust path as needed
const schoolRoutes = require('./routes/schoolRoutes');

app.use('/api/analytics', analyticsRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schools', schoolRoutes);

// ── Start server ─────────────────────────────
// This tells the engine to use Render's port first, or default to 3000 locally

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
module.exports = app;

