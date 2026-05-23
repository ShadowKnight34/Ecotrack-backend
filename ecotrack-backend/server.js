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

