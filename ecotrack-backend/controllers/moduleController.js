// ──────────────────────────────────────────────
//  Module Controller — SDG Content Delivery
// ──────────────────────────────────────────────

const pool = require('../config/db');

// ── GET /api/modules ─────────────────────────
// Returns a summary list of all available modules.
exports.getAllModules = async (req, res) => {
    try {
        const [modules] = await pool.query(
            'SELECT * FROM module'
        );

        return res.status(200).json(modules);
    } catch (error) {
        console.error('getAllModules error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve modules.',
        });
    }
};

// ── GET /api/modules/:id ─────────────────────
// Returns full details for a single module.
exports.getModuleById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT moduleID, title, category, content, coreMission, keyTargets, localRelevance 
            FROM Module 
            WHERE moduleID = ?
        `;

        const [rows] = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: `Module with ID ${id} not found.`,
            });
        }

        const moduleData = rows[0];

        // Safe Fallbacks: Ensure the columns are returned cleanly (as empty string instead of null/undefined)
        return res.status(200).json({
            moduleID: moduleData.moduleID,
            title: moduleData.title || '',
            category: moduleData.category || '',
            content: moduleData.content || '',
            description: moduleData.content || '', // compatibility mapping for ModuleDetailScreen description field
            coreMission: moduleData.coreMission || '',
            keyTargets: moduleData.keyTargets || '',
            localRelevance: moduleData.localRelevance || ''
        });
    } catch (error) {
        console.error('getModuleById error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve module.',
        });
    }
};

// ── GET /api/modules/:id/quiz ────────────────
// Returns quiz questions for a module.
// ⚠️  correctAnswer is intentionally OMITTED to prevent cheating.
exports.getQuizForModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { form } = req.query;

        let difficultyLevel = 1;
        if (form === '3') difficultyLevel = 2;
        else if (form === '4' || form === '5') difficultyLevel = 3;

        let [questions] = await pool.query(
            `SELECT questionID, moduleID, questionText,
              optionA, optionB, optionC, optionD
       FROM QuizQuestion
       WHERE moduleID = ? AND difficultyLevel = ?
       ORDER BY RAND()
       LIMIT 10`,
            [id, difficultyLevel]
        );

        if (questions.length === 0) {
            [questions] = await pool.query(
                `SELECT questionID, moduleID, questionText,
                  optionA, optionB, optionC, optionD
           FROM QuizQuestion
           WHERE moduleID = ? AND difficultyLevel = 1
           ORDER BY RAND()
           LIMIT 10`,
                [id]
            );
        }

        // Shuffle options so the correct answer isn't in the same position every time
        const randomizedQuestions = questions.map(q => {
            const options = [q.optionA, q.optionB, q.optionC, q.optionD];

            // Fisher-Yates shuffle algorithm
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }

            return {
                ...q,
                optionA: options[0],
                optionB: options[1],
                optionC: options[2],
                optionD: options[3]
            };
        });

        return res.status(200).json(randomizedQuestions);
    } catch (error) {
        console.error('getQuizForModule error:', error.message);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve quiz questions.',
        });
    }
};

// ── POST /api/modules ──────────────────────────
exports.createModule = async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Teachers only.' });
        }
        const { title, content, category } = req.body;
        if (!title || !content || !category) {
            return res.status(400).json({ message: 'title, content, and category are required' });
        }
        const [result] = await pool.query(
            'INSERT INTO module (title, content, category) VALUES (?, ?, ?)',
            [title, content, category]
        );
        return res.status(201).json({ message: 'Module created successfully', moduleID: result.insertId, title, content, category });
    } catch (error) {
        console.error('createModule error:', error.message);
        return res.status(500).json({ message: 'Failed to create module' });
    }
};

// ── PUT /api/modules/:id ───────────────────────
exports.updateModule = async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Teachers only.' });
        }
        const { id } = req.params;
        const { title, content, category } = req.body;
        if (!title || !content || !category) {
            return res.status(400).json({ message: 'title, content, and category are required' });
        }
        await pool.query(
            'UPDATE module SET title = ?, content = ?, category = ? WHERE moduleID = ?',
            [title, content, category, id]
        );
        return res.status(200).json({ message: 'Module updated successfully', moduleID: parseInt(id), title, content, category });
    } catch (error) {
        console.error('updateModule error:', error.message);
        return res.status(500).json({ message: 'Failed to update module' });
    }
};

// ── DELETE /api/modules/:id ────────────────────
exports.deleteModule = async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Teachers only.' });
        }
        const { id } = req.params;
        await pool.query('DELETE FROM module WHERE moduleID = ?', [id]);
        return res.status(200).json({ message: 'Module deleted successfully' });
    } catch (error) {
        console.error('deleteModule error:', error.message);
        return res.status(500).json({ message: 'Failed to delete module' });
    }
};

// ── GET /api/modules/:id/questions ─────────────
exports.getQuestionsForModule = async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Teachers only.' });
        }
        const { id } = req.params;
        const [questions] = await pool.query(
            'SELECT * FROM QuizQuestion WHERE moduleID = ?',
            [id]
        );
        return res.status(200).json(questions);
    } catch (error) {
        console.error('getQuestionsForModule error:', error.message);
        return res.status(500).json({ message: 'Failed to retrieve questions' });
    }
};

// ── POST /api/modules/:id/questions ────────────
exports.createQuestion = async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Teachers only.' });
        }
        const { id } = req.params;
        const { questionText, optionA, optionB, optionC, optionD, correctAnswer } = req.body;
        if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        const [result] = await pool.query(
            'INSERT INTO QuizQuestion (moduleID, questionText, optionA, optionB, optionC, optionD, correctAnswer) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, questionText, optionA, optionB, optionC, optionD, correctAnswer]
        );
        return res.status(201).json({ message: 'Question created successfully', questionID: result.insertId });
    } catch (error) {
        console.error('createQuestion error:', error.message);
        return res.status(500).json({ message: 'Failed to create question' });
    }
};

// ── PUT /api/modules/questions/:questionId ─────
exports.updateQuestion = async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Teachers only.' });
        }
        const { questionId } = req.params;
        const { questionText, optionA, optionB, optionC, optionD, correctAnswer } = req.body;
        if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        await pool.query(
            'UPDATE QuizQuestion SET questionText = ?, optionA = ?, optionB = ?, optionC = ?, optionD = ?, correctAnswer = ? WHERE questionID = ?',
            [questionText, optionA, optionB, optionC, optionD, correctAnswer, questionId]
        );
        return res.status(200).json({ message: 'Question updated successfully' });
    } catch (error) {
        console.error('updateQuestion error:', error.message);
        return res.status(500).json({ message: 'Failed to update question' });
    }
};

// ── DELETE /api/modules/questions/:questionId ──
exports.deleteQuestion = async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Teachers only.' });
        }
        const { questionId } = req.params;
        await pool.query('DELETE FROM QuizQuestion WHERE questionID = ?', [questionId]);
        return res.status(200).json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('deleteQuestion error:', error.message);
        return res.status(500).json({ message: 'Failed to delete question' });
    }
};
