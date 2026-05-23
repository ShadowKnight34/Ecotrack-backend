const pool = require('./config/db');

pool.query('DESCRIBE module_comments')
    .then(([rows]) => {
        console.log(rows);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
