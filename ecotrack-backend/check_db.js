const pool = require('./config/db');

async function check() {
    try {
        const [tables] = await pool.query("SHOW TABLES;");
        for (let t of tables) {
            let tableName = Object.values(t)[0];
            const [rows] = await pool.query(`DESCRIBE ${tableName};`);
            console.log(`\nTable ${tableName}:`, rows.map(r => ({Field: r.Field, Type: r.Type})));
        }
    } catch(err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
check();
