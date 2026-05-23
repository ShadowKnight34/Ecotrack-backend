const pool = require('./config/db');

const createTable = `
CREATE TABLE IF NOT EXISTS QuizAnswer (
    answerID INT AUTO_INCREMENT PRIMARY KEY,
    resultID INT NOT NULL,
    questionID INT NOT NULL,
    selectedOption VARCHAR(255) NOT NULL,
    isCorrect BOOLEAN NOT NULL,
    FOREIGN KEY (resultID) REFERENCES QuizResult(resultID) ON DELETE CASCADE,
    FOREIGN KEY (questionID) REFERENCES QuizQuestion(questionID) ON DELETE CASCADE
);
`;

pool.query(createTable)
    .then(() => console.log('QuizAnswer table created successfully.'))
    .catch(console.error)
    .finally(() => process.exit(0));
