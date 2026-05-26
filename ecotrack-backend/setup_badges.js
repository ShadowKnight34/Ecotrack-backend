const dotenv = require('dotenv');
dotenv.config();
const pool = require('./config/db');

(async () => {
  try {
    // Seed badges
    await pool.query(`
      INSERT IGNORE INTO Badge (badgeID, badgeName, requirement) VALUES
      (1, 'First Steps',   'Level 2'),
      (2, 'Rising Star',   'Level 5'),
      (3, 'Eco Champion',  'Level 10'),
      (4, 'Perfect Score', 'Score 100'),
      (5, 'Passing Grade', 'Score 50')
    `);
    console.log('Badges seeded');

    // Reset test user
    await pool.query('UPDATE user SET xp = 0, level = 1 WHERE userID = 1');
    await pool.query('DELETE FROM UserBadge WHERE userID = 1');
    console.log('Test user reset');

    // Show results
    const [badges] = await pool.query('SELECT * FROM Badge');
    badges.forEach(b => console.log(`  ${b.badgeID}: ${b.badgeName} [${b.requirement}]`));

    const [user] = await pool.query('SELECT userID, username, xp, level FROM user WHERE userID = 1');
    console.log('User:', JSON.stringify(user[0]));

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
