const pool = require('./config/db');

const migrate = async () => {
    try {
        console.log('Starting migration...');

        // Add difficultyLevel to QuizQuestion
        try {
            await pool.query('ALTER TABLE QuizQuestion ADD COLUMN difficultyLevel INT DEFAULT 1;');
            console.log('Added difficultyLevel to QuizQuestion');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('difficultyLevel already exists in QuizQuestion');
            } else throw err;
        }

        // Add formLevel to User
        try {
            await pool.query('ALTER TABLE user ADD COLUMN formLevel INT DEFAULT NULL;');
            console.log('Added formLevel to User');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('formLevel already exists in User');
            } else throw err;
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
};

migrate();
