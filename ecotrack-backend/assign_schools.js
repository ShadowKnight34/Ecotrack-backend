const pool = require('./config/db');

async function assignSchools() {
    try {
        console.log('Fetching all schools...');
        const [schools] = await pool.query('SELECT schoolID, schoolName FROM School');
        if (schools.length === 0) {
            console.log('No schools found! Please run node schools_migration.js first.');
            process.exit(1);
        }
        
        console.log(`Found ${schools.length} schools.`);
        
        console.log('Fetching all users...');
        const [users] = await pool.query('SELECT userID, username FROM user');
        console.log(`Found ${users.length} users.`);

        for (let user of users) {
            // Assign a random school
            const randomSchool = schools[Math.floor(Math.random() * schools.length)];
            await pool.query(
                'UPDATE user SET schoolID = ? WHERE userID = ?',
                [randomSchool.schoolID, user.userID]
            );
            console.log(`Assigned school "${randomSchool.schoolName}" to user "${user.username}".`);
        }

        console.log('All users successfully assigned to schools!');
    } catch (error) {
        console.error('Error assigning schools:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

assignSchools();
