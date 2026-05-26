// ──────────────────────────────────────────────
//  MySQL Connection Pool — powered by mysql2
// ──────────────────────────────────────────────

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

// ── Create connection pool ───────────────────
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecotrack_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false,
    },
});

// ── Connection test ──────────────────────────
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully!');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
})();

module.exports = pool;
