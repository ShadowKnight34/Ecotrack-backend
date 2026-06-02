const pool = require('./config/db');

async function test() {
    try {
        const [users] = await pool.query(
            `SELECT u.userID, u.username, u.schoolID, s.schoolName 
             FROM user u 
             LEFT JOIN School s ON u.schoolID = s.schoolID`
        );
        console.log('All Users and Schools:');
        console.log(JSON.stringify(users, null, 2));

        const [schools] = await pool.query('SELECT * FROM School');
        console.log('All Schools in DB:');
        console.log(JSON.stringify(schools, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

test();
