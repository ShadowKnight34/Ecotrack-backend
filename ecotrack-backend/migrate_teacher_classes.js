const pool = require('./config/db');

const createTable = `
CREATE TABLE IF NOT EXISTS teacher_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacherId INT,
    className VARCHAR(50),
    FOREIGN KEY (teacherId) REFERENCES user(userID) ON DELETE CASCADE
);
`;

async function runMigration() {
    try {
        console.log('Creating teacher_classes junction table...');
        await pool.query(createTable);
        console.log('✅ teacher_classes table created successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        process.exit(0);
    }
}

runMigration();
