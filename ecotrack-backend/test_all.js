// ──────────────────────────────────────────────
//  EcoTrack — Full Integration Test Suite
//  Tests every endpoint and business logic flow
// ──────────────────────────────────────────────

const dotenv = require('dotenv');
dotenv.config();
const pool = require('./config/db');

const BASE = 'http://localhost:3000';
let TOKEN = '';
let passed = 0;
let failed = 0;

// ── Helpers ──────────────────────────────────
async function request(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();
    return { status: res.status, data };
}

function assert(name, condition, detail = '') {
    if (condition) {
        console.log(`  ✅ ${name}`);
        passed++;
    } else {
        console.log(`  ❌ ${name} ${detail}`);
        failed++;
    }
}

// ── Test Suites ──────────────────────────────
async function resetTestData() {
    console.log('\n🔧 Resetting test data...');
    await pool.query("DELETE FROM UserBadge WHERE userID IN (SELECT userID FROM user WHERE email = 'integtest@ecotrack.com')");
    await pool.query("DELETE FROM QuizAnswer WHERE resultID IN (SELECT resultID FROM QuizResult WHERE userID IN (SELECT userID FROM user WHERE email = 'integtest@ecotrack.com'))");
    await pool.query("DELETE FROM QuizResult WHERE userID IN (SELECT userID FROM user WHERE email = 'integtest@ecotrack.com')");
    await pool.query("DELETE FROM Discussion WHERE userID IN (SELECT userID FROM user WHERE email = 'integtest@ecotrack.com')");
    await pool.query("DELETE FROM user WHERE email = 'integtest@ecotrack.com'");
    console.log('   Done.\n');
}

async function testHealthCheck() {
    console.log('═══ 1. HEALTH CHECK ═══');
    const { status, data } = await request('GET', '/');
    assert('GET / returns 200', status === 200);
    assert('Status is "ok"', data.status === 'ok');
    assert('Has timestamp', !!data.timestamp);
}

async function testAuth() {
    console.log('\n═══ 2. AUTHENTICATION ═══');

    // 2a. Register — missing fields
    const r1 = await request('POST', '/api/auth/register', { username: 'test' });
    assert('Register with missing fields → 400', r1.status === 400);

    // 2b. Register — success
    const r2 = await request('POST', '/api/auth/register', {
        username: 'integtest',
        email: 'integtest@ecotrack.com',
        password: 'TestPass123',
        className: '5 Harmony',
        schoolName: 'SMK Damansara Utama',
        formLevel: 4
    });
    assert('Register new user → 201', r2.status === 201);
    assert('Returns userId', !!r2.data.userId);

    // 2c. Register — duplicate
    const r3 = await request('POST', '/api/auth/register', {
        username: 'integtest',
        email: 'integtest@ecotrack.com',
        password: 'TestPass123',
        className: '5 Harmony',
        schoolName: 'SMK Damansara Utama',
        formLevel: 4
    });
    assert('Duplicate email → 409', r3.status === 409);

    // 2d. Login — wrong password
    const r4 = await request('POST', '/api/auth/login', {
        email: 'integtest@ecotrack.com',
        password: 'WrongPass',
    });
    assert('Login wrong password → 401', r4.status === 401);

    // 2e. Login — success
    const r5 = await request('POST', '/api/auth/login', {
        email: 'integtest@ecotrack.com',
        password: 'TestPass123',
    });
    assert('Login success → 200', r5.status === 200);
    assert('Returns JWT token', typeof r5.data.token === 'string' && r5.data.token.length > 20);
    assert('Returns user info', !!r5.data.user && !!r5.data.user.username);
    assert('Password NOT in response', !r5.data.user.password);
    TOKEN = r5.data.token;

    // 2f. Update profile
    const r6 = await request('PUT', '/api/auth/profile', {
        className: '5 Harmony Updated',
        formLevel: 5
    }, TOKEN);
    assert('Update profile → 200', r6.status === 200);

    // 2g. Check updated info in /me
    const r7 = await request('GET', '/api/auth/me', null, TOKEN);
    assert('Get me → 200', r7.status === 200);
    assert('className is updated', r7.data.className === '5 Harmony Updated');
    assert('formLevel is updated', r7.data.formLevel === 5);
}

async function testAuthMiddleware() {
    console.log('\n═══ 3. AUTH MIDDLEWARE ═══');

    // 3a. No token
    const r1 = await request('GET', '/api/modules');
    assert('No token → 401', r1.status === 401);

    // 3b. Invalid token
    const r2 = await request('GET', '/api/modules', null, 'invalid.token.here');
    assert('Invalid token → 403', r2.status === 403);

    // 3c. Valid token
    const r3 = await request('GET', '/api/modules', null, TOKEN);
    assert('Valid token → 200', r3.status === 200);
}

async function testModules() {
    console.log('\n═══ 4. SDG MODULES ═══');

    // 4a. List all modules
    const r1 = await request('GET', '/api/modules', null, TOKEN);
    assert('GET /modules → 200', r1.status === 200);
    assert('Returns array', Array.isArray(r1.data));
    assert('Modules have title & category', r1.data.length > 0 && !!r1.data[0].title && !!r1.data[0].category);

    // 4b. Single module
    const r2 = await request('GET', '/api/modules/1', null, TOKEN);
    assert('GET /modules/1 → 200', r2.status === 200);
    assert('Returns moduleID=1', r2.data.moduleID === 1);

    // 4c. Module not found
    const r3 = await request('GET', '/api/modules/9999', null, TOKEN);
    assert('GET /modules/9999 → 404', r3.status === 404);

    // 4d. Quiz questions
    const r4 = await request('GET', '/api/modules/1/quiz', null, TOKEN);
    assert('GET /modules/1/quiz → 200', r4.status === 200);
    assert('Returns questions array', Array.isArray(r4.data) && r4.data.length > 0);
    assert('Has questionText', !!r4.data[0].questionText);
    assert('Has options A-D', !!r4.data[0].optionA && !!r4.data[0].optionB && !!r4.data[0].optionC && !!r4.data[0].optionD);
    assert('correctAnswer NOT present (anti-cheat)', r4.data[0].correctAnswer === undefined);

    // 4e. Quiz questions fallback check (Form 5 requesting module 1)
    const r5 = await request('GET', '/api/modules/1/quiz?form=5', null, TOKEN);
    assert('GET /modules/1/quiz?form=5 (fallback) → 200', r5.status === 200);
    assert('Returns fallback questions array', Array.isArray(r5.data) && r5.data.length > 0);
}

async function testQuizGrading() {
    console.log('\n═══ 5. QUIZ GRADING ═══');

    // 5a. Missing fields
    const r1 = await request('POST', '/api/quizzes/submit', {}, TOKEN);
    assert('Missing fields → 400', r1.status === 400);

    // 5b. Submit 50% score (1 right, 1 wrong)
    const r2 = await request('POST', '/api/quizzes/submit', {
        moduleID: 1,
        answers: [
            { questionID: 3, selectedOption: 'End poverty in all its forms everywhere' },  // correct
            { questionID: 4, selectedOption: '5%' },  // wrong (correct is 10%)
        ]
    }, TOKEN);
    console.log("Quiz Submit Response r2:", r2);
    assert('Submit quiz → 200', r2.status === 200);
    assert('Score = 50', r2.data.score === 50);
    assert('correctCount = 1', r2.data.correctCount === 1);
    assert('totalQuestions = 2', r2.data.totalQuestions === 2);

    // 5c. Submit 100% score
    const r3 = await request('POST', '/api/quizzes/submit', {
        moduleID: 1,
        answers: [
            { questionID: 3, selectedOption: 'End poverty in all its forms everywhere' },
            { questionID: 4, selectedOption: '10%' },
        ],
    }, TOKEN);
    assert('Perfect quiz → score 100', r3.data.score === 100);
    assert('correctCount = 2', r3.data.correctCount === 2);

    // 5d. Get user quiz results
    const r4 = await request('GET', '/api/quizzes/user-results', null, TOKEN);
    assert('Get user results → 200', r4.status === 200);
    assert('Returns array', Array.isArray(r4.data));
    assert('Contains at least 2 attempts', r4.data.length >= 2);
    assert('First attempt has score and moduleID', r4.data[0].score !== undefined && r4.data[0].moduleID !== undefined);
}

async function testGamification() {
    console.log('\n═══ 6. GAMIFICATION (XP, Levels, Badges) ═══');

    // After the two quizzes above: 50% → +50 XP, 100% → +100 XP = 150 XP total
    const [userRows] = await pool.query(
        "SELECT xp, level FROM user WHERE email = 'integtest@ecotrack.com'"
    );
    const user = userRows[0];
    assert('XP = 150 (50 + 100)', user.xp === 150);
    assert('Level = 2 (150 XP ≥ 100 threshold)', user.level === 2);

    // Check badges earned
    const [badges] = await pool.query(
        `SELECT b.badgeName FROM UserBadge ub
     JOIN Badge b ON ub.badgeID = b.badgeID
     WHERE ub.userID = (SELECT userID FROM user WHERE email = 'integtest@ecotrack.com')`
    );
    const badgeNames = badges.map((b) => b.badgeName);
    assert('Badge: "Passing Grade" earned (score ≥ 50)', badgeNames.includes('Passing Grade'));
    assert('Badge: "Perfect Score" earned (score = 100)', badgeNames.includes('Perfect Score'));

    // Submit one more quiz to push XP past 200 → level up
    console.log('   (Submitting another quiz to trigger level-up...)');
    await request('POST', '/api/quizzes/submit', {
        moduleID: 1,
        answers: [
            { questionID: 3, selectedOption: 'End poverty in all its forms everywhere' },
            { questionID: 4, selectedOption: '10%' },
        ],
    }, TOKEN);

    const [updatedRows] = await pool.query(
        "SELECT xp, level FROM user WHERE email = 'integtest@ecotrack.com'"
    );
    const updated = updatedRows[0];
    assert('XP = 250 after 3rd quiz (+100)', updated.xp === 250);
    assert('Level = 2 (250 XP ≥ 100 threshold)', updated.level === 2);

    // Check "First Steps" badge (Level 2)
    const [newBadges] = await pool.query(
        `SELECT b.badgeName FROM UserBadge ub
     JOIN Badge b ON ub.badgeID = b.badgeID
     WHERE ub.userID = (SELECT userID FROM user WHERE email = 'integtest@ecotrack.com')`
    );
    const newBadgeNames = newBadges.map((b) => b.badgeName);
    assert('Badge: "First Steps" earned (level ≥ 2)', newBadgeNames.includes('First Steps'));
}

async function testLeaderboard() {
    console.log('\n═══ 7. LEADERBOARD ═══');

    const r1 = await request('GET', '/api/leaderboard', null, TOKEN);
    assert('GET /leaderboard → 200', r1.status === 200);
    assert('Returns array', Array.isArray(r1.data));
    assert('Users sorted by XP desc', r1.data.length > 0 && r1.data[0].xp >= (r1.data[1]?.xp || 0));
    assert('Contains username, level, xp', !!r1.data[0].username && r1.data[0].level !== undefined && r1.data[0].xp !== undefined);
}

async function testDiscussions() {
    console.log('\n═══ 8. DISCUSSIONS ═══');

    // 8a. Post discussion
    const postPayload = {
        title: 'SDG Goals Discussion',
        content: 'Let us talk about SDG Goal 1: No Poverty.',
        category: 'General Feed'
    };
    const r1 = await request('POST', '/api/discussions', postPayload, TOKEN);
    assert('POST /api/discussions → 201', r1.status === 201);
    assert('Returns post info', !!r1.data.discussionID);
    const postID = r1.data.discussionID;

    // 8b. Fetch discussions with incorrect formLevel query param (should filter out)
    const r2_filtered = await request('GET', `/api/discussions?formLevel=1`, null, TOKEN);
    assert('GET /api/discussions?formLevel=1 → 200', r2_filtered.status === 200);
    const createdPostFiltered = r2_filtered.data.find(p => p.postID === postID);
    assert('Post of Form 5 student filtered out for Form 1 query', !createdPostFiltered);

    // 8c. Fetch discussions with correct formLevel query param (should include)
    const r2 = await request('GET', `/api/discussions?formLevel=5`, null, TOKEN);
    assert('GET /api/discussions?formLevel=5 → 200', r2.status === 200);
    assert('Returns array of posts', Array.isArray(r2.data));
    const createdPost = r2.data.find(p => p.postID === postID);
    assert('Found the created post on Form 5 stream', !!createdPost);
    assert('Post has correct content', createdPost.content === postPayload.content);
    assert('Post returns author details', !!createdPost.username && createdPost.formLevel !== undefined);

    // 8d. Delete discussion post
    const r3 = await request('DELETE', `/api/discussions/${postID}`, null, TOKEN);
    assert('DELETE /api/discussions/:id → 200', r3.status === 200);
}

// ── Runner ───────────────────────────────────
(async () => {
    try {
        await resetTestData();

        await testHealthCheck();
        await testAuth();
        await testAuthMiddleware();
        await testModules();
        await testQuizGrading();
        await testGamification();
        await testLeaderboard();
        await testDiscussions();

        console.log('\n════════════════════════════════════');
        console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
        console.log('════════════════════════════════════\n');

        process.exit(failed > 0 ? 1 : 0);
    } catch (e) {
        console.error('\n💥 Test runner crashed:', e.message);
        process.exit(1);
    }
})();
