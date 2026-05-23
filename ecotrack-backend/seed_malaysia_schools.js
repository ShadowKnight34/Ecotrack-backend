const pool = require('./config/db');

const schools = [
    "SMK Bukit Bandaraya",
    "SMK Putrajaya Presint 8(1)",
    "SMK Aminuddin Baki",
    "SMK Seksyen 9 Shah Alam",
    "SMK Convent Bukit Nanas",
    "SMK Cyberjaya",
    "SMK Taman Tun Dr Ismail",
    "SMK Victoria",
    "SMK St. John",
    "SMK Assunta",
    "SMK Subang Utama",
    "SMK USJ 12",
    "SMK USJ 4",
    "SMK Subang Jaya",
    "SMK Bandar Utama Damansara (3)",
    "SMK Kelana Jaya",
    "SMK Petaling Jaya",
    "SMK Damansara Utama",
    "SMK Bandar Sri Damansara 1",
    "SMK Sri Sentosa",
    "SMK Taman Melawati",
    "SMK Gombak Setia",
    "SMK Cochrane",
    "SMK Methodist (ACS) Ipoh",
    "SMK St. Michael, Ipoh",
    "SMK Penang Free",
    "SMK Chung Ling, Penang",
    "SMK St. Xavier's Institution, Penang",
    "SMK Tinggi Melaka",
    "SMK Convent, Melaka",
    "SMK St. Francis, Melaka",
    "SMK Tinggi Kluang",
    "SMK English College",
    "SMK Sultan Ismail, Johor Bahru",
    "SMK Sultanah Engku Tun Aminah",
    "SMK Abdul Rahman Talib, Kuantan",
    "SMK Tinggi Kuantan",
    "SMK Sultan Sulaiman, Kuala Terengganu",
    "SMK Sultan Ismail, Kota Bharu",
    "SMK King George V, Seremban",
    "SMK St. Paul, Seremban",
    "SMK Convent, Seremban",
    "SMK Tinggi Bukit Mertajam",
    "SMK Anderson, Ipoh",
    "SMK St. Thomas, Kuantan",
    "SMK Kuching High",
    "SMK St. Joseph, Kuching",
    "SMK All Saints, Kota Kinabalu",
    "SMK Sabah College",
    "SMK Putrajaya Presint 11(1)"
];

async function seedSchools() {
    console.log(`Starting migration of ${schools.length} schools...`);
    let insertedCount = 0;
    let skippedCount = 0;

    try {
        for (let i = 0; i < schools.length; i++) {
            const schoolName = schools[i];
            
            // Check if schoolName already exists
            const [rows] = await pool.query(
                'SELECT COUNT(*) AS count FROM School WHERE schoolName = ?',
                [schoolName]
            );

            if (rows[0].count === 0) {
                // Generate a unique schoolCode complying with UNIQUE NOT NULL constraint
                const cleanName = schoolName.replace(/[^A-Za-z0-9]/g, '').substring(0, 5).toUpperCase();
                const schoolCode = `${cleanName}-${1000 + i}`;
                
                await pool.query(
                    'INSERT INTO School (schoolName, schoolCode) VALUES (?, ?)',
                    [schoolName, schoolCode]
                );
                insertedCount++;
            } else {
                skippedCount++;
            }
        }
        console.log(`Migration finished. Inserted: ${insertedCount}, Skipped (already exists): ${skippedCount}`);
    } catch (error) {
        console.error('Migration encountered an error:', error);
    } finally {
        // Close database pool cleanly
        await pool.end();
        console.log('Database pool closed cleanly.');
    }
}

seedSchools();
