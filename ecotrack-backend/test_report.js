const pool = require('./config/db');

async function testPipeline() {
    try {
        console.log("1. Finding a teacher and student 4...");
        const [teacher] = await pool.query("SELECT email FROM user WHERE role = 'teacher' LIMIT 1");
        
        if (!teacher.length) {
            console.log("No teacher found, cannot test.");
            process.exit(0);
        }

        console.log(`2. Logging in as ${teacher[0].email}...`);
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: teacher[0].email,
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log("3. Fetching report for student 4...");

        const reportRes = await fetch('http://localhost:3000/api/teacher/students/4/report', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const reportData = await reportRes.json();
        console.log("4. Backend returned:", JSON.stringify(reportData, null, 2));

        // 5. Test JSON mapping (simulating UI map)
        const SDG_CATEGORIES = [
            "No Poverty", "Zero Hunger", "Good Health and Well-being", "Quality Education",
            "Gender Equality", "Clean Water and Sanitation", "Affordable and Clean Energy",
            "Decent Work and Economic Growth", "Industry, Innovation and Infrastructure",
            "Reduced Inequalities", "Sustainable Cities and Communities",
            "Responsible Consumption and Production", "Climate Action", "Life Below Water",
            "Life on Land", "Peace, Justice and Strong Institutions", "Partnerships for the Goals"
        ];
        
        const backendReport = reportData.report || [];
        const mappedData = SDG_CATEGORIES.map(category => {
            const found = backendReport.find(r => r.category === category);
            return {
                category,
                bestScore: found ? parseInt(found.bestScore || 0) : 0,
                totalAttempts: found ? parseInt(found.totalAttempts || 0) : 0
            };
        });

        console.log("5. Frontend mapping result:");
        console.log(JSON.stringify(mappedData.slice(0, 3), null, 2)); // show first 3
        console.log("Pipeline test successful.");

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        process.exit(0);
    }
}

testPipeline();
