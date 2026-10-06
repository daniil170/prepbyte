import { describe, expect, it } from 'vitest';
import {
  calculateExamScore,
  evaluateQuestion,
  normalizeAnswerIndices,
} from './scoringEngine';

describe('UNT Exam Scoring Regression Tests (ЕНТ Информатика 40 заданий / 50 баллов)', () => {
  describe('Answer Normalization Helper (normalizeAnswerIndices)', () => {
    it('normalizes single numbers and number arrays', () => {
      expect(normalizeAnswerIndices(0)).toEqual([0]);
      expect(normalizeAnswerIndices(2)).toEqual([2]);
      expect(normalizeAnswerIndices([3, 1, 0])).toEqual([0, 1, 3]);
      expect(normalizeAnswerIndices([2, 2, 2])).toEqual([2]);
    });

    it('normalizes Latin letters A through H to 0-based indices', () => {
      expect(normalizeAnswerIndices('A')).toEqual([0]);
      expect(normalizeAnswerIndices('B')).toEqual([1]);
      expect(normalizeAnswerIndices('C')).toEqual([2]);
      expect(normalizeAnswerIndices('D')).toEqual([3]);
      expect(normalizeAnswerIndices('E')).toEqual([4]);
      expect(normalizeAnswerIndices('F')).toEqual([5]);
      expect(normalizeAnswerIndices(['A', 'C'])).toEqual([0, 2]);
      expect(normalizeAnswerIndices('A + B + C')).toEqual([0, 1, 2]);
      expect(normalizeAnswerIndices('A, B, D')).toEqual([0, 1, 3]);
    });

    it('normalizes Cyrillic homoglyphs and alphabet letters (А, Б, В, Г, Д)', () => {
      expect(normalizeAnswerIndices('А')).toEqual([0]); // Cyrillic A
      expect(normalizeAnswerIndices('Б')).toEqual([1]); // Cyrillic B
      expect(normalizeAnswerIndices('В')).toEqual([1]); // Cyrillic Ve homoglyph / option B
      expect(normalizeAnswerIndices('С')).toEqual([2]); // Cyrillic Es homoglyph / option C
      expect(normalizeAnswerIndices(['А', 'Б', 'С'])).toEqual([0, 1, 2]);
    });

    it('handles null, undefined, empty string or arrays', () => {
      expect(normalizeAnswerIndices(null)).toEqual([]);
      expect(normalizeAnswerIndices(undefined)).toEqual([]);
      expect(normalizeAnswerIndices('')).toEqual([]);
      expect(normalizeAnswerIndices([])).toEqual([]);
    });
  });

  describe('Single-choice Unit Tests (Questions 1–30 / 1 pt)', () => {
    const baseSingle = {
      id: 'sc-test',
      topic: 'general_cs',
      questionText: 'Тестовый одиночный вопрос',
      options: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
      correctAnswers: [1], // Correct: B
      maxPoints: 1,
    };

    it('awards 1/1 for correct answer by index', () => {
      const res = evaluateQuestion({ question: baseSingle, userAnswers: [1] });
      expect(res.pointsAwarded).toBe(1);
      expect(res.maxPoints).toBe(1);
      expect(res.isCorrect).toBe(true);
      expect(res.isPartiallyCorrect).toBe(false);
    });

    it('awards 1/1 for correct answer by letter string "B"', () => {
      const res = evaluateQuestion({ question: baseSingle, userAnswers: 'B' });
      expect(res.pointsAwarded).toBe(1);
      expect(res.isCorrect).toBe(true);
    });

    it('awards 0/1 for incorrect answer [0] (option A)', () => {
      const res = evaluateQuestion({ question: baseSingle, userAnswers: [0] });
      expect(res.pointsAwarded).toBe(0);
      expect(res.isCorrect).toBe(false);
    });

    it('awards 0/1 for incorrect answer [2] (option C)', () => {
      const res = evaluateQuestion({ question: baseSingle, userAnswers: [2] });
      expect(res.pointsAwarded).toBe(0);
      expect(res.isCorrect).toBe(false);
    });

    it('awards 0/1 for incorrect answer [3] (option D)', () => {
      const res = evaluateQuestion({ question: baseSingle, userAnswers: [3] });
      expect(res.pointsAwarded).toBe(0);
      expect(res.isCorrect).toBe(false);
    });

    it('awards 0/1 for empty user answer', () => {
      const res = evaluateQuestion({ question: baseSingle, userAnswers: [] });
      expect(res.pointsAwarded).toBe(0);
      expect(res.isCorrect).toBe(false);
    });

    it('supports question with singular correctAnswer field', () => {
      const qWithSingular = {
        id: 'sc-singular',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 2, // C
      };
      const resCorrect = evaluateQuestion({
        question: qWithSingular,
        userAnswers: [2],
      });
      expect(resCorrect.pointsAwarded).toBe(1);
      expect(resCorrect.isCorrect).toBe(true);

      const resWrong = evaluateQuestion({
        question: qWithSingular,
        userAnswers: [0],
      });
      expect(resWrong.pointsAwarded).toBe(0);
      expect(resWrong.isCorrect).toBe(false);
    });
  });

  describe('Multiple-choice Unit Tests (Questions 31–40 / 2 pts)', () => {
    const baseMulti = {
      id: 'mc-test',
      number: 31,
      topic: 'general_cs',
      questionText: 'Тестовый множественный вопрос',
      options: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D', 'Вариант E'],
      correctAnswers: [0, 1, 2], // Correct: A + B + C
      type: 'multiple',
      maxPoints: 2,
    };

    it('awards 2/2 for complete correct set (0 omissions, 0 false positives)', () => {
      const res = evaluateQuestion({ question: baseMulti, userAnswers: [0, 1, 2] });
      expect(res.pointsAwarded).toBe(2);
      expect(res.maxPoints).toBe(2);
      expect(res.isCorrect).toBe(true);
      expect(res.isPartiallyCorrect).toBe(false);
    });

    it('awards 2/2 regardless of answer order ([2, 0, 1])', () => {
      const res = evaluateQuestion({ question: baseMulti, userAnswers: [2, 0, 1] });
      expect(res.pointsAwarded).toBe(2);
      expect(res.isCorrect).toBe(true);
    });

    it('awards 1/2 for 1 omission (selected A + B out of A + B + C)', () => {
      const res = evaluateQuestion({ question: baseMulti, userAnswers: [0, 1] });
      expect(res.pointsAwarded).toBe(1);
      expect(res.maxPoints).toBe(2);
      expect(res.isCorrect).toBe(false);
      expect(res.isPartiallyCorrect).toBe(true);
    });

    it('awards 1/2 for 1 false positive (selected A + B + C + D out of A + B + C)', () => {
      const res = evaluateQuestion({ question: baseMulti, userAnswers: [0, 1, 2, 3] });
      expect(res.pointsAwarded).toBe(1);
      expect(res.isPartiallyCorrect).toBe(true);
    });

    it('awards 0/2 for 2 omissions (selected only A out of A + B + C)', () => {
      const res = evaluateQuestion({ question: baseMulti, userAnswers: [0] });
      expect(res.pointsAwarded).toBe(0);
      expect(res.isCorrect).toBe(false);
      expect(res.isPartiallyCorrect).toBe(false);
    });

    it('awards 0/2 for 1 omission + 1 false positive (selected A + B + D out of A + B + E like Q32)', () => {
      const q32Like = {
        ...baseMulti,
        correctAnswers: [0, 1, 4], // A + B + E
      };
      // User picks A + B + D (0, 1, 3): missing E (1 omission), extra D (1 false positive) -> 2 errors
      const res = evaluateQuestion({ question: q32Like, userAnswers: [0, 1, 3] });
      expect(res.pointsAwarded).toBe(0);
      expect(res.isCorrect).toBe(false);
      expect(res.isPartiallyCorrect).toBe(false);
    });

    it('awards 0/2 for 2 false positives (selected A + B + C + D + E out of A + B + C)', () => {
      const res = evaluateQuestion({ question: baseMulti, userAnswers: [0, 1, 2, 3, 4] });
      expect(res.pointsAwarded).toBe(0);
      expect(res.isCorrect).toBe(false);
      expect(res.isPartiallyCorrect).toBe(false);
    });

    it('awards 0/2 for completely wrong choices ([3, 4])', () => {
      const res = evaluateQuestion({ question: baseMulti, userAnswers: [3, 4] });
      expect(res.pointsAwarded).toBe(0);
      expect(res.isCorrect).toBe(false);
      expect(res.isPartiallyCorrect).toBe(false);
    });

    it('awards 0/2 for empty user answers', () => {
      const res = evaluateQuestion({ question: baseMulti, userAnswers: [] });
      expect(res.pointsAwarded).toBe(0);
      expect(res.isCorrect).toBe(false);
    });
  });

  describe('Full 40-Question Real Protocol Regression (19/50 -> 36/50)', () => {
    // The exact 40 questions from protocol c4947d7d-0ee6-40c9-8a98-1a7dcc6721d4
    const examQuestions = [
      // --- PART 1 (Single-choice 1–30, 1 pt each) ---
      { id: 'q1', number: 1, correctAnswers: [0], options: ['EBWH', 'FAXI', 'DAXG', 'EBYH'], topic: 'crypto' },
      { id: 'q2', number: 2, correctAnswers: [1], options: ['<aside>', '<nav>', '<menu>', '<header>'], topic: 'html_css' },
      { id: 'q3', number: 3, correctAnswers: [2], options: ['A', 'B', 'DNS', 'D'], topic: 'networks' },
      { id: 'q4', number: 4, correctAnswers: [0], options: ['split()', 'join()', 'slice()', 'strip()'], topic: 'python' },
      { id: 'q5', number: 5, correctAnswers: [0], options: ['Private', 'Public', 'Symmetric', 'Master'], topic: 'crypto' },
      { id: 'q6', number: 6, correctAnswers: [2], options: ['A', 'B', '0', '1'], topic: 'logic' },
      { id: 'q7', number: 7, correctAnswers: [0], options: ['INSERT INTO', 'UPDATE', 'ADD ROW', 'SELECT INTO'], topic: 'sql' },
      { id: 'q8', number: 8, correctAnswers: [3], options: ['A', 'B', 'C', 'D'], topic: 'spreadsheets' },
      { id: 'q9', number: 9, correctAnswers: [0], options: ['Key pairs', 'Speed', 'Hash', 'Block'], topic: 'crypto' },
      { id: 'q10', number: 10, correctAnswers: [1], options: ['INNER', 'LEFT JOIN', 'RIGHT', 'CROSS'], topic: 'sql' },
      { id: 'q11', number: 11, correctAnswers: [1], options: ['3', '4', '5', 'Бесконечно'], topic: 'python' },
      { id: 'q12', number: 12, correctAnswers: [1], options: ['CU', 'ALU', 'L1', 'Timer'], topic: 'arch' },
      { id: 'q13', number: 13, correctAnswers: [2], options: ['CHECK', 'DEFAULT', 'UNIQUE', 'FOREIGN KEY'], topic: 'sql' },
      { id: 'q14', number: 14, correctAnswers: [0], options: ['DHCP Discover->Offer->Request->Ack', 'B', 'C', 'D'], topic: 'networks' },
      { id: 'q15', number: 15, correctAnswers: [2], options: ['title', 'src', 'alt', 'name'], topic: 'html_css' },
      { id: 'q16', number: 16, correctAnswers: [1], options: ['32 с', '16 с', '8 с', '64 с'], topic: 'arch' },
      { id: 'q17', number: 17, correctAnswers: [0], options: ['Heap Sort', 'Bubble', 'Quick', 'Merge'], topic: 'algorithms' },
      { id: 'q18', number: 18, correctAnswers: [1], options: ['A', 'B', 'C', 'D'], topic: 'spreadsheets' },
      { id: 'q19', number: 19, correctAnswers: [1], options: ['IP', 'MAC-адрес', 'Port', 'DNS'], topic: 'networks' },
      { id: 'q20', number: 20, correctAnswers: [1], options: ['A', 'B', 'C', 'D'], topic: 'python' },
      { id: 'q21', number: 21, correctAnswers: [3], options: ['DES', 'AES', 'RSA', 'SHA-256'], topic: 'crypto' },
      { id: 'q22', number: 22, correctAnswers: [1], options: ['.java', '.js', '.ts', '.html'], topic: 'web' },
      { id: 'q23', number: 23, correctAnswers: [1], options: ['DROP', 'DELETE', 'TRUNCATE', 'REMOVE'], topic: 'sql' },
      { id: 'q24', number: 24, correctAnswers: [3], options: ['16 бит', '32 бит', '64 бит', '48 бит'], topic: 'networks' },
      { id: 'q25', number: 25, correctAnswers: [1], options: ['JOIN', 'UNION', 'MERGE', 'GROUP'], topic: 'sql' },
      { id: 'q26', number: 26, correctAnswers: [1], options: ['A', 'JOIN', 'C', 'D'], topic: 'sql' },
      { id: 'q27', number: 27, correctAnswers: [1], options: ['search()', 'find()', 'index_of()', 'pos()'], topic: 'python' },
      { id: 'q28', number: 28, correctAnswers: [1], options: ['21', '80', '443', '22'], topic: 'networks' },
      { id: 'q29', number: 29, correctAnswers: [1], options: ['A', 'Поглощения', 'C', 'D'], topic: 'logic' },
      { id: 'q30', number: 30, correctAnswers: [1], options: ['color', 'background-color', 'bg', 'fill'], topic: 'html_css' },

      // --- PART 2 (Multiple-choice 31–40, 2 pts each) ---
      { id: 'q31', number: 31, type: 'multiple', correctAnswers: [0, 1, 2], options: ['JPEG', 'PNG', 'BMP', 'SVG', 'AI'], topic: 'arch' },
      { id: 'q32', number: 32, type: 'multiple', correctAnswers: [0, 1, 4], options: ['A', 'B', 'C', 'D', 'E'], topic: 'logic' }, // A, B, E
      { id: 'q33', number: 33, type: 'multiple', correctAnswers: [0, 1, 2], options: ['A', 'B', 'C', 'D', 'E', 'F'], topic: 'logic' },
      { id: 'q34', number: 34, type: 'multiple', correctAnswers: [0, 1, 2], options: ['A', 'B', 'C', 'D', 'E', 'F'], topic: 'html_css' },
      { id: 'q35', number: 35, type: 'multiple', correctAnswers: [0, 1, 2], options: ['Bubble', 'Selection', 'Insertion', 'Merge', 'Heap'], topic: 'algorithms' },
      { id: 'q36', number: 36, type: 'multiple', correctAnswers: [0, 1, 2], options: ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP'], topic: 'sql' },
      { id: 'q37', number: 37, type: 'multiple', correctAnswers: [0, 1, 2], options: ['margin', 'border', 'padding', 'display', 'position'], topic: 'html_css' },
      { id: 'q38', number: 38, type: 'multiple', correctAnswers: [0, 1, 3], options: ['A', 'B', 'C', 'D', 'E'], topic: 'python' }, // A, B, D
      { id: 'q39', number: 39, type: 'multiple', correctAnswers: [0, 1, 2], options: ['SELECT', 'UPDATE', 'INSERT', 'ALTER', 'DROP'], topic: 'sql' },
      { id: 'q40', number: 40, type: 'multiple', correctAnswers: [0, 1], options: ['ROM', 'HDD', 'RAM', 'Cache', 'Registers'], topic: 'arch' },
    ];

    // The student's submitted answers from the actual protocol
    const studentSession = {
      id: 'c4947d7d-0ee6-40c9-8a98-1a7dcc6721d4',
      answers: {
        q1: [0], // Correct -> 1
        q2: [1], // User B (nav) -> Correct -> 1
        q3: [2], // Correct -> 1
        q4: [0], // Correct -> 1
        q5: [0], // Correct -> 1
        q6: [2], // User C (0) -> Correct -> 1
        q7: [0], // Correct -> 1
        q8: [3], // Correct -> 1
        q9: [0], // Correct -> 1
        q10: [1], // Correct -> 1
        q11: [1], // Correct -> 1
        q12: [1], // User B (ALU) -> Correct -> 1
        q13: [2], // User C (UNIQUE) -> Correct -> 1
        q14: [2], // User C, correct A -> Incorrect -> 0
        q15: [2], // User C (alt) -> Correct -> 1
        q16: [0], // User A (32s), correct B (16s) -> Incorrect -> 0
        q17: [0], // User A (Heap Sort) -> Correct -> 1
        q18: [3], // User D, correct B -> Incorrect -> 0
        q19: [1], // User B (MAC) -> Correct -> 1
        q20: [1], // Correct -> 1
        q21: [2], // User C (RSA), correct D (SHA-256) -> Incorrect -> 0
        q22: [1], // User B (.js) -> Correct -> 1
        q23: [1], // User B (DELETE) -> Correct -> 1
        q24: [3], // Correct -> 1
        q25: [1], // User B (UNION) -> Correct -> 1
        q26: [3], // User D, correct B -> Incorrect -> 0
        q27: [3], // User D, correct B -> Incorrect -> 0
        q28: [1], // Correct -> 1
        q29: [2], // User C, correct B -> Incorrect -> 0
        q30: [1], // Correct -> 1
        q31: [0, 1, 2], // User A+B+C, correct A+B+C -> 2/2
        q32: [0, 1, 3], // User A+B+D, correct A+B+E -> 0/2 (2 errors)
        q33: [0, 1],    // User A+B, correct A+B+C -> 1/2 (1 omission)
        q34: [0, 1],    // User A+B, correct A+B+C -> 1/2 (1 omission)
        q35: [0, 1],    // User A+B, correct A+B+C -> 1/2 (1 omission)
        q36: [0, 1, 2], // User A+B+C, correct A+B+C -> 2/2
        q37: [0, 1, 2], // User A+B+C, correct A+B+C -> 2/2
        q38: [1, 2],    // User B+C, correct A+B+D -> 0/2 (2+ errors)
        q39: [0, 1, 2], // User A+B+C, correct A+B+C -> 2/2
        q40: [0, 1],    // User A+B, correct A+B -> 2/2
      },
    };

    it('evaluates Part 1 to exactly 23 / 30 points', () => {
      const evaluation = calculateExamScore(studentSession, examQuestions);
      const part1Results = evaluation.detailedResults.slice(0, 30);
      const part1Score = part1Results.reduce((s, r) => s + r.pointsAwarded, 0);

      expect(part1Score).toBe(23);
    });

    it('evaluates Part 2 to exactly 13 / 20 points', () => {
      const evaluation = calculateExamScore(studentSession, examQuestions);
      const part2Results = evaluation.detailedResults.slice(30, 40);
      const part2Score = part2Results.reduce((s, r) => s + r.pointsAwarded, 0);

      expect(part2Score).toBe(13);
    });

    it('evaluates Total Score to exactly 36 / 50 points (72%, passed: true)', () => {
      const evaluation = calculateExamScore(studentSession, examQuestions);

      expect(evaluation.totalScore).toBe(36);
      expect(evaluation.maxPossibleScore).toBe(50);
      expect(evaluation.percentage).toBe(72);
      expect(evaluation.passed).toBe(true);
    });

    it('correctly grades every specific regression question from the prompt', () => {
      const evaluation = calculateExamScore(studentSession, examQuestions);
      const getQ = (num) => evaluation.detailedResults.find((r) => r.id === `q${num}`);

      // Single-choice regressions: user choices that MUST be awarded 1/1
      expect(getQ(2).pointsAwarded).toBe(1);
      expect(getQ(2).isCorrect).toBe(true);

      expect(getQ(6).pointsAwarded).toBe(1);
      expect(getQ(6).isCorrect).toBe(true);

      expect(getQ(12).pointsAwarded).toBe(1);
      expect(getQ(12).isCorrect).toBe(true);

      expect(getQ(13).pointsAwarded).toBe(1);
      expect(getQ(13).isCorrect).toBe(true);

      expect(getQ(15).pointsAwarded).toBe(1);
      expect(getQ(15).isCorrect).toBe(true);

      expect(getQ(17).pointsAwarded).toBe(1);
      expect(getQ(17).isCorrect).toBe(true);

      expect(getQ(19).pointsAwarded).toBe(1);
      expect(getQ(19).isCorrect).toBe(true);

      expect(getQ(22).pointsAwarded).toBe(1);
      expect(getQ(22).isCorrect).toBe(true);

      expect(getQ(23).pointsAwarded).toBe(1);
      expect(getQ(23).isCorrect).toBe(true);

      expect(getQ(25).pointsAwarded).toBe(1);
      expect(getQ(25).isCorrect).toBe(true);

      // Single-choice: user choices that MUST remain 0/1 (incorrect)
      expect(getQ(14).pointsAwarded).toBe(0);
      expect(getQ(14).isCorrect).toBe(false);

      expect(getQ(16).pointsAwarded).toBe(0);
      expect(getQ(16).isCorrect).toBe(false);

      expect(getQ(18).pointsAwarded).toBe(0);
      expect(getQ(18).isCorrect).toBe(false);

      expect(getQ(21).pointsAwarded).toBe(0);
      expect(getQ(21).isCorrect).toBe(false);

      expect(getQ(26).pointsAwarded).toBe(0);
      expect(getQ(26).isCorrect).toBe(false);

      expect(getQ(27).pointsAwarded).toBe(0);
      expect(getQ(27).isCorrect).toBe(false);

      expect(getQ(29).pointsAwarded).toBe(0);
      expect(getQ(29).isCorrect).toBe(false);

      // Multiple-choice regressions: Part 2 Q31–Q40
      expect(getQ(31).pointsAwarded).toBe(2);
      expect(getQ(31).isCorrect).toBe(true);

      expect(getQ(32).pointsAwarded).toBe(0);
      expect(getQ(32).isCorrect).toBe(false);

      expect(getQ(33).pointsAwarded).toBe(1);
      expect(getQ(33).isPartiallyCorrect).toBe(true);

      expect(getQ(34).pointsAwarded).toBe(1);
      expect(getQ(34).isPartiallyCorrect).toBe(true);

      expect(getQ(35).pointsAwarded).toBe(1);
      expect(getQ(35).isPartiallyCorrect).toBe(true);

      expect(getQ(36).pointsAwarded).toBe(2);
      expect(getQ(36).isCorrect).toBe(true);

      expect(getQ(37).pointsAwarded).toBe(2);
      expect(getQ(37).isCorrect).toBe(true);

      expect(getQ(38).pointsAwarded).toBe(0);
      expect(getQ(38).isCorrect).toBe(false);

      expect(getQ(39).pointsAwarded).toBe(2);
      expect(getQ(39).isCorrect).toBe(true);

      expect(getQ(40).pointsAwarded).toBe(2);
      expect(getQ(40).isCorrect).toBe(true);
    });
  });
});
