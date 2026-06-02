const pool = require('./config/db');

const dropTable = 'DROP TABLE IF EXISTS teacher_classes;';

const createTable = `
CREATE TABLE teacher_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacherId INT NOT NULL,
    className VARCHAR(50) NOT NULL,
    FOREIGN KEY (teacherId) REFERENCES user(userID) ON DELETE CASCADE
) ENGINE=InnoDB;
`;

async function runMigration() {
    try {
        console.log('Dropping teacher_classes table if it exists...');
        await pool.query(dropTable);

        console.log('Creating teacher_classes junction table with Foreign Key constraint...');
        await pool.query(createTable);
        console.log('✅ teacher_classes table created successfully with constraints.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        process.exit(0);
    }
}

runMigration();
