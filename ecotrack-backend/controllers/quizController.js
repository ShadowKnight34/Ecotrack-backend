// ──────────────────────────────────────────────
//  Quiz Controller — Auto-Grading Engine
// ──────────────────────────────────────────────

const pool = require('../config/db');
const processGamification = require('./gamificationEngine');

// ── POST /api/quizzes/submit ─────────────────
// Grades a quiz submission entirely on the server side.
// The frontend NEVER receives the answer key.
exports.submitQuiz = async (req, res) => {
    try {
        const { moduleID, answers } = req.body;
        const userID = req.user.userID;

        // 1 ── Validate input
        if (!moduleID || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'moduleID and a non-empty answers array are required.',
            });
        }

        // 2 ── Fetch correct answers from DB for this module
        const [correctRows] = await pool.query(
            'SELECT questionID, correctAnswer FROM QuizQuestion WHERE moduleID = ?',
            [moduleID]
        );

        if (correctRows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: `No quiz questions found for module ${moduleID}.`,
            });
        }

        // 3 ── Build a lookup map: questionID → correctAnswer
        const answerKey = {};
        correctRows.forEach((row) => {
            answerKey[row.questionID] = row.correctAnswer;
        });

        // 4 ── Grade the submission
        const totalQuestions = answers.length;
        let correctCount = 0;

        answers.forEach((answer) => {
            const correct = answerKey[answer.questionID];
            if (correct && answer.selectedOption.trim().toLowerCase() === correct.trim().toLowerCase()) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / totalQuestions) * 100);

        // 5 ── Save the attempt in QuizResult and QuizAnswer (Atomic Transaction)
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                'INSERT INTO QuizResult (userID, moduleID, score) VALUES (?, ?, ?)',
                [userID, moduleID, score]
            );
            const resultID = result.insertId;

            // Prepare bulk insert for QuizAnswer
            const answerValues = answers.map(answer => {
                const correct = answerKey[answer.questionID];
                const isCorrect = correct && answer.selectedOption.trim().toLowerCase() === correct.trim().toLowerCase();
                return [resultID, answer.questionID, answer.selectedOption, isCorrect];
            });

            if (answerValues.length > 0) {
                await connection.query(
                    'INSERT INTO QuizAnswer (resultID, questionID, selectedOption, isCorrect) VALUES ?',
                    [answerValues]
                );
            }

            await connection.commit();
        } catch (dbError) {
            await connection.rollback();
            throw dbError; // Rethrow to be caught by the outer catch block
        } finally {
            connection.release();
        }

        // 6 ── Trigger gamification processing (Students only)
        let gamificationResult = {};
        if (req.user.role === 'student') {
            gamificationResult = await processGamification(userID, score) || {};
        }

        // 7 ── Return the result (never expose the answer key)
        return res.status(200).json({
            message: 'Quiz submitted successfully.',
            moduleID,
            totalQuestions,
            correctCount,
            score,
            ...gamificationResult
        });
    } catch (error) {
        console.error('submitQuiz error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to process quiz submission.',
        });
    }
};

// ── GET /api/quizzes/user-results ─────────────
exports.getUserResults = async (req, res) => {
    try {
        const userID = req.user.userID;
        const [results] = await pool.query(
            'SELECT resultID, userID, moduleID, score, dateTaken FROM QuizResult WHERE userID = ?',
            [userID]
        );
        return res.status(200).json(results);
    } catch (error) {
        console.error('getUserResults error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve user quiz results.',
        });
    }
};

