const pool = require('./config/db');

const createSchoolTable = `
CREATE TABLE IF NOT EXISTS School (
    schoolID INT AUTO_INCREMENT PRIMARY KEY,
    schoolName VARCHAR(255) NOT NULL,
    schoolCode VARCHAR(50) UNIQUE NOT NULL
);
`;

const alterUserTableAddColumn = `
ALTER TABLE user ADD COLUMN schoolID INT;
`;

const alterUserTableAddFK = `
ALTER TABLE user ADD FOREIGN KEY (schoolID) REFERENCES School(schoolID) ON DELETE SET NULL;
`;

const insertDummySchools = `
INSERT IGNORE INTO School (schoolName, schoolCode) VALUES 
('SMK Damansara Utama', 'SMKDU-01'),
('SK Bangsar', 'SKB-02'),
('SMK Bukit Bintang', 'SMKBB-03');
`;

async function runMigration() {
    try {
        console.log('Creating School table...');
        await pool.query(createSchoolTable);
        console.log('School table created.');

        try {
            console.log('Altering User table to add schoolID column...');
            await pool.query(alterUserTableAddColumn);
            console.log('schoolID column added.');
        } catch (colErr) {
            if (colErr.code === 'ER_DUP_FIELDNAME') {
                console.log('schoolID column already exists, skipping.');
            } else {
                throw colErr;
            }
        }

        try {
            console.log('Adding Foreign Key constraint...');
            await pool.query(alterUserTableAddFK);
            console.log('Foreign Key added.');
        } catch (fkErr) {
            // Error 1061 is Duplicate key name (meaning FK already exists) or 1826 duplicate FK constraint name
            console.log('Foreign Key constraint might already exist, skipping.');
            console.error('FK Error info:', fkErr.message);
        }

        console.log('Inserting dummy schools...');
        await pool.query(insertDummySchools);
        console.log('Dummy schools inserted.');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

runMigration();
