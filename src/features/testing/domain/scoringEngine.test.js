import { describe, expect, it } from 'vitest';
import { calculateExamScore, evaluateQuestion } from './scoringEngine';

describe('scoringEngine', () => {
  describe('evaluateQuestion - Single Choice', () => {
    const singleChoiceQuestion = {
      id: 'sc-1',
      topic: 'python_loops',
      questionText: 'What is the output?',
      options: ['10', '20', '30', '40'],
      correctAnswers: [1],
      explanation: 'Step by step explanation.',
      difficulty: 'easy',
    };

    it('awards 1 point when the exact correct answer is selected', () => {
      const result = evaluateQuestion({
        question: singleChoiceQuestion,
        userAnswers: [1],
      });

      expect(result.pointsAwarded).toBe(1);
      expect(result.maxPoints).toBe(1);
      expect(result.isCorrect).toBe(true);
      expect(result.isPartiallyCorrect).toBe(false);
      expect(result.userAnswers).toEqual([1]);
      expect(result.correctAnswers).toEqual([1]);
    });

    it('awards 0 points when an incorrect option is selected', () => {
      const result = evaluateQuestion({
        question: singleChoiceQuestion,
        userAnswers: [0],
      });

      expect(result.pointsAwarded).toBe(0);
      expect(result.maxPoints).toBe(1);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(false);
    });

    it('awards 0 points when no option is selected', () => {
      const result = evaluateQuestion({
        question: singleChoiceQuestion,
        userAnswers: [],
      });

      expect(result.pointsAwarded).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it('awards 0 points when multiple options are selected for a single-choice question', () => {
      const result = evaluateQuestion({
        question: singleChoiceQuestion,
        userAnswers: [1, 2],
      });

      expect(result.pointsAwarded).toBe(0);
      expect(result.isCorrect).toBe(false);
    });

    it('handles duplicate indices in user answers gracefully', () => {
      const result = evaluateQuestion({
        question: singleChoiceQuestion,
        userAnswers: [1, 1, 1],
      });

      expect(result.pointsAwarded).toBe(1);
      expect(result.userAnswers).toEqual([1]);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('evaluateQuestion - Multiple Choice Partial Credit (UNT rules)', () => {
    const multiChoiceQuestion = {
      id: 'mc-1',
      topic: 'network_protocols',
      questionText: 'Select transport layer protocols.',
      options: ['TCP', 'IP', 'UDP', 'HTTP', 'FTP'],
      correctAnswers: [0, 2], // TCP and UDP
      explanation: 'TCP and UDP are transport layer protocols.',
      difficulty: 'medium',
    };

    it('awards 2 points for all correct options with 0 errors', () => {
      const result = evaluateQuestion({
        question: multiChoiceQuestion,
        userAnswers: [0, 2],
      });

      expect(result.pointsAwarded).toBe(2);
      expect(result.maxPoints).toBe(2);
      expect(result.isCorrect).toBe(true);
      expect(result.isPartiallyCorrect).toBe(false);
    });

    it('awards 1 point for exactly 1 omission (selected [0] instead of [0, 2])', () => {
      const result = evaluateQuestion({
        question: multiChoiceQuestion,
        userAnswers: [0],
      });

      expect(result.pointsAwarded).toBe(1);
      expect(result.maxPoints).toBe(2);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(true);
    });

    it('awards 1 point for exactly 1 omission (selected [2] instead of [0, 2])', () => {
      const result = evaluateQuestion({
        question: multiChoiceQuestion,
        userAnswers: [2],
      });

      expect(result.pointsAwarded).toBe(1);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(true);
    });

    it('awards 1 point for exactly 1 false positive (selected [0, 2, 3])', () => {
      const result = evaluateQuestion({
        question: multiChoiceQuestion,
        userAnswers: [0, 2, 3],
      });

      expect(result.pointsAwarded).toBe(1);
      expect(result.maxPoints).toBe(2);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(true);
    });

    it('awards 0 points for 1 omission and 1 false positive (selected [0, 1] instead of [0, 2])', () => {
      // 1 omission (2 missing), 1 false positive (1 extra) -> 2 errors
      const result = evaluateQuestion({
        question: multiChoiceQuestion,
        userAnswers: [0, 1],
      });

      expect(result.pointsAwarded).toBe(0);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(false);
    });

    it('awards 0 points when no answers are provided (2 omissions)', () => {
      const result = evaluateQuestion({
        question: multiChoiceQuestion,
        userAnswers: [],
      });

      expect(result.pointsAwarded).toBe(0);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(false);
    });

    it('awards 0 points when all selected answers are false positives (selected [1, 3])', () => {
      const result = evaluateQuestion({
        question: multiChoiceQuestion,
        userAnswers: [1, 3],
      });

      expect(result.pointsAwarded).toBe(0);
      expect(result.isCorrect).toBe(false);
      expect(result.isPartiallyCorrect).toBe(false);
    });

    describe('Multiple Choice with 3 correct answers', () => {
      const threeAnswersQuestion = {
        id: 'mc-3',
        topic: 'cpu_memory',
        questionText: 'Select CPU registers.',
        options: ['AX', 'BX', 'CX', 'RAM', 'SSD'],
        correctAnswers: [0, 1, 2],
        explanation: 'AX, BX, CX are general purpose registers.',
      };

      it('awards 2 points when all 3 correct options are chosen', () => {
        const result = evaluateQuestion({
          question: threeAnswersQuestion,
          userAnswers: [0, 1, 2],
        });
        expect(result.pointsAwarded).toBe(2);
        expect(result.isCorrect).toBe(true);
      });

      it('awards 1 point for 1 omission out of 3 (selected [0, 1])', () => {
        const result = evaluateQuestion({
          question: threeAnswersQuestion,
          userAnswers: [0, 1],
        });
        expect(result.pointsAwarded).toBe(1);
        expect(result.isPartiallyCorrect).toBe(true);
      });

      it('awards 1 point for all 3 correct plus 1 false positive (selected [0, 1, 2, 3])', () => {
        const result = evaluateQuestion({
          question: threeAnswersQuestion,
          userAnswers: [0, 1, 2, 3],
        });
        expect(result.pointsAwarded).toBe(1);
        expect(result.isPartiallyCorrect).toBe(true);
      });

      it('awards 0 points for 2 omissions (selected only [0])', () => {
        const result = evaluateQuestion({
          question: threeAnswersQuestion,
          userAnswers: [0],
        });
        expect(result.pointsAwarded).toBe(0);
      });

      it('awards 0 points for 1 omission and 1 false positive (selected [0, 1, 4])', () => {
        const result = evaluateQuestion({
          question: threeAnswersQuestion,
          userAnswers: [0, 1, 4],
        });
        expect(result.pointsAwarded).toBe(0);
      });
    });
  });

  describe('calculateExamScore', () => {
    const mockQuestions = [
      {
        id: 'q-sc-1',
        topic: 'python_loops',
        questionText: 'Q1',
        options: ['A', 'B', 'C', 'D'],
        correctAnswers: [0],
        explanation: 'Exp 1',
      },
      {
        id: 'q-sc-2',
        topic: 'python_loops',
        questionText: 'Q2',
        options: ['A', 'B', 'C', 'D'],
        correctAnswers: [2],
        explanation: 'Exp 2',
      },
      {
        id: 'q-mc-1',
        topic: 'sql_queries',
        questionText: 'Q3',
        options: ['A', 'B', 'C', 'D', 'E'],
        correctAnswers: [1, 3],
        explanation: 'Exp 3',
      },
      {
        id: 'q-mc-2',
        topic: 'sql_queries',
        questionText: 'Q4',
        options: ['A', 'B', 'C', 'D', 'E'],
        correctAnswers: [0, 2],
        explanation: 'Exp 4',
      },
    ];

    it('calculates full scores across multiple questions and topics', () => {
      const session = {
        answers: {
          'q-sc-1': [0], // 1 pt (correct)
          'q-sc-2': [2], // 1 pt (correct)
          'q-mc-1': [1, 3], // 2 pts (correct)
          'q-mc-2': [0], // 1 pt (partial credit)
        },
      };

      const result = calculateExamScore(session, mockQuestions);

      expect(result.totalScore).toBe(5); // 1 + 1 + 2 + 1 = 5
      expect(result.maxPossibleScore).toBe(6); // 1 + 1 + 2 + 2 = 6
      expect(result.percentage).toBe(83); // 5/6 = 83.33% -> 83%
      expect(result.passed).toBe(true);

      // Topic breakdown
      expect(result.byTopicBreakdown.python_loops).toEqual({
        topic: 'python_loops',
        score: 2,
        maxScore: 2,
        percentage: 100,
        totalQuestions: 2,
        correctCount: 2,
        partialCount: 0,
        incorrectCount: 0,
      });

      expect(result.byTopicBreakdown.sql_queries).toEqual({
        topic: 'sql_queries',
        score: 3,
        maxScore: 4,
        percentage: 75,
        totalQuestions: 2,
        correctCount: 1,
        partialCount: 1,
        incorrectCount: 0,
      });

      expect(result.detailedResults).toHaveLength(4);
      expect(result.detailedResults[0].pointsAwarded).toBe(1);
      expect(result.detailedResults[3].pointsAwarded).toBe(1);
      expect(result.detailedResults[3].isPartiallyCorrect).toBe(true);
    });

    it('handles completely unattempted exam', () => {
      const session = { answers: {} };
      const result = calculateExamScore(session, mockQuestions);

      expect(result.totalScore).toBe(0);
      expect(result.maxPossibleScore).toBe(6);
      expect(result.percentage).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.detailedResults).toHaveLength(4);
      expect(result.detailedResults.every((r) => r.pointsAwarded === 0)).toBe(
        true
      );
    });

    it('throws error when questions parameter is not an array', () => {
      expect(() => calculateExamScore({}, null)).toThrow(
        'Список вопросов должен быть массивом.'
      );
    });
  });
});
