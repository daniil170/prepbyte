import { describe, it, expect } from 'vitest';
import { evaluateAnswers, sanitizeStudentAnswers } from './index';

describe('Cloud Functions index.js logic tests', () => {
  const protectedQuestions = [
    { id: 'q1', topic: 'python', correctAnswers: [0] },
    { id: 'q2', topic: 'python', correctAnswers: [1] },
    { id: 'q3', topic: 'sql', correctAnswers: [0, 2] },
    { id: 'q4', topic: 'sql', correctAnswers: [1, 3] },
  ];

  describe('sanitizeStudentAnswers', () => {
    it('1. Filters out foreign question IDs not in authorized list', () => {
      const authorizedIds = ['q1', 'q2'];
      const rawAnswers = {
        q1: [0],
        q_secret: [0, 1],
        q_hack: [2],
      };
      const sanitized = sanitizeStudentAnswers(rawAnswers, authorizedIds);
      expect(sanitized).toHaveProperty('q1', [0]);
      expect(sanitized).not.toHaveProperty('q_secret');
      expect(sanitized).not.toHaveProperty('q_hack');
    });

    it('2. Discards negative numbers, strings, nulls, and nested objects from option indices', () => {
      const authorizedIds = ['q1', 'q2', 'q3'];
      const rawAnswers = {
        q1: [-1, '0', null, { evil: true }, 0, 0],
        q2: 'invalid',
        q3: [2, 0, 2],
      };
      const optionsMap = new Map([
        ['q1', 4],
        ['q2', 4],
        ['q3', 4],
      ]);
      const sanitized = sanitizeStudentAnswers(rawAnswers, authorizedIds, optionsMap);

      expect(sanitized.q1).toEqual([0]); // Only valid number 0 remains, duplicates removed
      expect(sanitized.q2).toEqual([]); // Non-array invalid turns to []
      expect(sanitized.q3).toEqual([0, 2]); // Duplicates removed, sorted
    });

    it('3. Rejects indices greater than or equal to options count', () => {
      const authorizedIds = ['q1'];
      const optionsMap = new Map([['q1', 4]]); // valid indices 0, 1, 2, 3
      const rawAnswers = { q1: [0, 3, 4, 99] };

      const sanitized = sanitizeStudentAnswers(rawAnswers, authorizedIds, optionsMap);
      expect(sanitized.q1).toEqual([0, 3]);
    });
  });

  describe('evaluateAnswers', () => {
    it('1. Single choice: awards 1 point for exact match, 0 for wrong match', () => {
      const answers = { q1: [0], q2: [0] }; // q1 correct (1 pt), q2 wrong (0 pt)
      const res = evaluateAnswers(answers, protectedQuestions.slice(0, 2));

      expect(res.totalScore).toBe(1);
      expect(res.maxPossibleScore).toBe(2);
      expect(res.percentage).toBe(50);
      expect(res.passed).toBe(true);
      expect(res.correctAnswersCount).toBe(1);
    });

    it('2. Multi choice: awards 2 pts for exact match, 1 pt for 1 error/omission, 0 for >=2 errors', () => {
      // q3 correctAnswers: [0, 2] (2 pts)
      // q4 correctAnswers: [1, 3] (2 pts)

      // Exact match on q3: [0, 2] -> 2 pts
      // 1 omission on q4: [1] -> 1 pt
      const answers = { q3: [0, 2], q4: [1] };
      const res = evaluateAnswers(answers, protectedQuestions.slice(2, 4));

      expect(res.totalScore).toBe(3);
      expect(res.maxPossibleScore).toBe(4);
      expect(res.percentage).toBe(75);
      expect(res.correctAnswersCount).toBe(1); // only q3 is fully correct
    });

    it('3. Generates correct byTopicBreakdown', () => {
      const answers = {
        q1: [0], // python 1/1
        q2: [1], // python 1/1
        q3: [0, 2], // sql 2/2
        q4: [0], // sql 0/2 (two errors: missed 1, 3, false positive 0)
      };

      const res = evaluateAnswers(answers, protectedQuestions);
      expect(res.byTopicBreakdown.python.score).toBe(2);
      expect(res.byTopicBreakdown.python.maxScore).toBe(2);
      expect(res.byTopicBreakdown.python.percentage).toBe(100);

      expect(res.byTopicBreakdown.sql.score).toBe(2);
      expect(res.byTopicBreakdown.sql.maxScore).toBe(4);
      expect(res.byTopicBreakdown.sql.percentage).toBe(50);
    });

    it('4. Handles empty, null, or corrupted inputs safely without crashing', () => {
      expect(() => evaluateAnswers(null, null)).not.toThrow();
      const res = evaluateAnswers({}, []);
      expect(res.totalScore).toBe(0);
      expect(res.maxPossibleScore).toBe(0);
      expect(res.percentage).toBe(0);
      expect(res.passed).toBe(false);
    });
  });

  describe('Cloud Functions exports', () => {
    it('exports saveQuestion and archiveQuestion callable functions', async () => {
      const funcModule = await import('./index');
      expect(typeof funcModule.saveQuestion).toBe('function');
      expect(typeof funcModule.archiveQuestion).toBe('function');
    });
  });
});
