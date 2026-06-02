const pool = require('./config/db');

async function test() {
    try {
        const [posts] = await pool.query(
            `SELECT d.*, u.username, u.formLevel, u.role, u.className, u.schoolID, s.schoolName
             FROM Discussion d 
             JOIN user u ON d.userID = u.userID
             LEFT JOIN School s ON u.schoolID = s.schoolID`
        );
        console.log('All Discussion Posts and Schools:');
        console.log(JSON.stringify(posts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

test();
