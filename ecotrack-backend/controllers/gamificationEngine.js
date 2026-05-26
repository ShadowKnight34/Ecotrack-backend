// ──────────────────────────────────────────────
//  Gamification Engine — XP, Levels & Badges
// ──────────────────────────────────────────────

const pool = require('../config/db');

/**
 * Determine XP to award based on quiz score percentage.
 */
function calculateXP(score) {
    if (score === 100) return 100;
    if (score >= 80) return 80;
    if (score >= 50) return 50;
    return 10; // participation XP
}

/**
 * Calculate level from total XP.
 * Thresholds: Level 2 >= 100 XP, Level 3 >= 300 XP
 */
function calculateLevel(totalXP) {
    if (totalXP >= 300) return 3;
    if (totalXP >= 100) return 2;
    return 1;
}

/**
 * Core gamification processor.
 * Called after a quiz is graded — awards XP, handles level-ups,
 * and triggers badge unlocks.
 *
 * @param {number} userID  — the authenticated user's ID
 * @param {number} score   — the quiz score percentage (0–100)
 */
async function processGamification(userID, score) {
    try {
        // ── 1. Calculate XP to award ─────────────
        const xpEarned = calculateXP(score);

        // ── 2. Get user's current stats ──────────
        const [userRows] = await pool.query(
            'SELECT xp, level FROM user WHERE userID = ?',
            [userID]
        );

        if (userRows.length === 0) {
            console.error(`Gamification: user ${userID} not found`);
            return;
        }

        const currentXP = userRows[0].xp || 0;
        const currentLevel = userRows[0].level || 1;

        // ── 3. Compute new totals ────────────────
        const newXP = currentXP + xpEarned;
        const newLevel = calculateLevel(newXP);

        // ── 4. Persist updated stats ─────────────
        await pool.query(
            'UPDATE user SET xp = ?, level = ? WHERE userID = ?',
            [newXP, newLevel, userID]
        );

        const leveledUp = newLevel > currentLevel;
        if (leveledUp) {
            console.log(`🎉 User ${userID} leveled up! ${currentLevel} → ${newLevel}`);
        }

        console.log(
            `🎮 Gamification — user: ${userID} | +${xpEarned} XP | ` +
            `total: ${newXP} XP | level: ${newLevel}`
        );

        // ── 5. Badge unlock checks ───────────────
        await checkAndAwardBadges(userID, newLevel, score);

        return { leveledUp, newLevel, xpEarned, newXP };
    } catch (error) {
        // Gamification errors should NOT break the quiz response
        console.error('Gamification error:', error.message);
        return { leveledUp: false, newLevel: 1, xpEarned: 0, newXP: 0 };
    }
}

/**
 * Check all available badges and award any the user has earned
 * but does not yet possess.
 *
 * Badge table schema: badgeID, badgeName, requirement
 * UserBadge table schema: userBadgeID, userID, badgeID, dateEarned
 */
async function checkAndAwardBadges(userID, newLevel, score) {
    try {
        // Fetch all badge definitions
        const [badges] = await pool.query(
            'SELECT badgeID, badgeName, requirement FROM Badge'
        );

        for (const badge of badges) {
            let earned = false;

            // ── Level-based badges ───────────────
            // requirement format: "Level X" (e.g. "Level 5", "Level 10")
            const levelMatch = badge.requirement.match(/^Level\s+(\d+)$/i);
            if (levelMatch) {
                const requiredLevel = parseInt(levelMatch[1], 10);
                earned = newLevel >= requiredLevel;
            }

            // ── Score-based badges ───────────────
            // requirement format: "Score X" (e.g. "Score 100")
            const scoreMatch = badge.requirement.match(/^Score\s+(\d+)$/i);
            if (scoreMatch) {
                const requiredScore = parseInt(scoreMatch[1], 10);
                earned = score >= requiredScore;
            }

            // ── Award if earned and not already owned ──
            if (earned) {
                const [existing] = await pool.query(
                    'SELECT userBadgeID FROM UserBadge WHERE userID = ? AND badgeID = ?',
                    [userID, badge.badgeID]
                );

                if (existing.length === 0) {
                    await pool.query(
                        'INSERT INTO UserBadge (userID, badgeID) VALUES (?, ?)',
                        [userID, badge.badgeID]
                    );
                    console.log(`🏅 Badge unlocked for user ${userID}: "${badge.badgeName}"`);
                }
            }
        }
    } catch (error) {
        console.error('Badge check error:', error.message);
    }
}

module.exports = processGamification;
