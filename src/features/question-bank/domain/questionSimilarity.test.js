import { describe, expect, it } from 'vitest';
import {
  auditBank,
  calculateJaccardSimilarity,
  extractWordShingles,
  findExactDuplicates,
  findNearDuplicates,
  normalizeQuestionText,
} from './questionSimilarity';

describe('questionSimilarity domain', () => {
  describe('normalizeQuestionText', () => {
    it('returns empty string for non-string or empty inputs', () => {
      expect(normalizeQuestionText(null)).toBe('');
      expect(normalizeQuestionText(undefined)).toBe('');
      expect(normalizeQuestionText(123)).toBe('');
      expect(normalizeQuestionText('')).toBe('');
      expect(normalizeQuestionText('   ')).toBe('');
    });

    it('lowercases, trims and collapses whitespace', () => {
      expect(
        normalizeQuestionText('   Что   выведет    КОД   Python? \n\t  ')
      ).toBe('что выведет код python?');
    });

    it('strips code fence markers and inline backticks', () => {
      const codeText = `
        Каков результат работы функции:
        \`\`\`python
        def foo(x):
            return x * 2
        \`\`\`
        при вызове \`foo(5)\`?
      `;
      const normalized = normalizeQuestionText(codeText);
      expect(normalized).not.toContain('```');
      expect(normalized).not.toContain('`');
      expect(normalized).toBe(
        'каков результат работы функции: def foo(x): return x * 2 при вызове foo(5)?'
      );
    });
  });

  describe('extractWordShingles & calculateJaccardSimilarity', () => {
    it('returns empty Set for empty string', () => {
      expect(extractWordShingles('').size).toBe(0);
    });

    it('handles short text with fewer than 3 words', () => {
      const shingles = extractWordShingles('SQL запрос');
      expect(shingles.size).toBe(1);
      expect(shingles.has('sql запрос')).toBe(true);
    });

    it('extracts overlapping 3-word shingles for longer text', () => {
      const shingles = extractWordShingles('один два три четыре пять');
      expect(shingles.size).toBe(3);
      expect(shingles.has('один два три')).toBe(true);
      expect(shingles.has('два три четыре')).toBe(true);
      expect(shingles.has('три четыре пять')).toBe(true);
    });

    it('computes Jaccard similarity correctly', () => {
      expect(calculateJaccardSimilarity(new Set(), new Set(['a']))).toBe(0);

      const setA = new Set(['a b c', 'b c d']);
      const setB = new Set(['a b c', 'b c d']);
      expect(calculateJaccardSimilarity(setA, setB)).toBe(1);

      const setC = new Set(['a b c', 'x y z']);
      // intersection: ['a b c'] (1), union: ['a b c', 'b c d', 'x y z'] (3) -> 1/3 ~ 0.333
      expect(calculateJaccardSimilarity(setA, setC)).toBeCloseTo(1 / 3, 2);
    });
  });

  describe('findExactDuplicates', () => {
    it('returns empty array for empty questions list', () => {
      expect(findExactDuplicates([])).toEqual([]);
      expect(findExactDuplicates(null)).toEqual([]);
    });

    it('detects duplicate question texts regardless of casing, spacing or code fences', () => {
      const questions = [
        { id: 'q1', questionText: 'Что такое стек в структурах данных?' },
        { id: 'q2', questionText: 'Какая сложность у бинарного поиска?' },
        {
          id: 'q3',
          questionText: '  что   такое СТЕК   в структурах данных?  ',
        },
        {
          id: 'q4',
          questionText: '```\nЧто такое стек в структурах данных?\n```',
        },
      ];

      const duplicates = findExactDuplicates(questions);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].ids).toEqual(['q1', 'q3', 'q4']);
      expect(duplicates[0].normalizedText).toBe(
        'что такое стек в структурах данных?'
      );
    });
  });

  describe('findNearDuplicates', () => {
    it('returns empty array when fewer than 2 questions are provided', () => {
      expect(findNearDuplicates([])).toEqual([]);
      expect(findNearDuplicates([{ id: 'q1', questionText: 'текст' }])).toEqual(
        []
      );
    });

    it('identifies near-duplicate questions meeting threshold and sorts descending', () => {
      const questions = [
        {
          id: 'q1',
          questionText:
            'Какой сетевой протокол используется для защищенной передачи веб-страниц по протоколу TLS в сетях интернет?',
        },
        {
          id: 'q2',
          questionText:
            'Какой сетевой протокол используется для защищенной передачи веб-страниц по протоколу SSL в сетях интернет?',
        },
        {
          id: 'q3',
          questionText:
            'Определите объем оперативной памяти при 32-разрядной адресации шины данных процессора.',
        },
      ];

      const nearDuplicates = findNearDuplicates(questions, { threshold: 0.6 });
      expect(nearDuplicates.length).toBeGreaterThan(0);
      expect(nearDuplicates[0].q1).toBe('q1');
      expect(nearDuplicates[0].q2).toBe('q2');
      expect(nearDuplicates[0].score).toBeGreaterThanOrEqual(0.6);
    });

    it('correctly handles code snippets in near-duplicate comparisons', () => {
      const questions = [
        {
          id: 'code1',
          questionText:
            'Что выведет данный фрагмент кода на языке Python при выполнении программы?\n```python\ns = 0\nfor i in range(1, 10):\n    s += i\nprint(s)\n```\nВыберите правильный вариант ответа.',
        },
        {
          id: 'code2',
          questionText:
            'Что выведет данный фрагмент кода на языке Python при выполнении программы?\n```python\ns = 0\nfor k in range(1, 10):\n    s += k\nprint(s)\n```\nВыберите правильный вариант ответа.',
        },
      ];

      const result = findNearDuplicates(questions, { threshold: 0.5 });
      expect(result).toHaveLength(1);
      expect(result[0].score).toBeGreaterThan(0.5);
    });
  });

  describe('auditBank', () => {
    it('handles empty questions list gracefully', () => {
      const audit = auditBank([]);
      expect(audit.totalCount).toBe(0);
      expect(audit.perType).toEqual({ single: 0, multiple: 0 });
      expect(audit.supportedDisjointVariants).toBe(0);
      expect(audit.limitingType).toBe('equal');
      expect(audit.missingFor5.missingSingle).toBe(150);
      expect(audit.missingFor5.missingMultiple).toBe(50);
      expect(audit.missingFor10.missingSingle).toBe(300);
      expect(audit.missingFor10.missingMultiple).toBe(100);
      expect(audit.exactDuplicates).toEqual([]);
      expect(audit.nearDuplicates).toEqual([]);
    });

    it('calculates counts, disjoint variants capacity and bottlenecks accurately', () => {
      const mockQuestions = [];

      // 89 single questions (each has 1 correct answer)
      for (let i = 0; i < 89; i++) {
        mockQuestions.push({
          id: `single-${i}`,
          topic: i % 2 === 0 ? 'python_loops' : 'sql_queries',
          difficulty: i % 3 === 0 ? 'easy' : 'medium',
          correctAnswers: [0],
          questionText: `Уникальный текст вопроса single ${i} для проверки алгоритмов`,
        });
      }

      // 30 multiple questions (each has >=2 correct answers)
      for (let i = 0; i < 30; i++) {
        mockQuestions.push({
          id: `multi-${i}`,
          topic: 'network_protocols',
          difficulty: 'hard',
          correctAnswers: [0, 1],
          questionText: `Уникальный текст вопроса multiple ${i} для проверки сетевых протоколов`,
        });
      }

      const audit = auditBank(mockQuestions, { single: 30, multiple: 10 });

      expect(audit.totalCount).toBe(119);
      expect(audit.perType.single).toBe(89);
      expect(audit.perType.multiple).toBe(30);
      expect(audit.perTopic.python_loops).toBe(45);
      expect(audit.perTopic.sql_queries).toBe(44);
      expect(audit.perTopic.network_protocols).toBe(30);

      // Single supports floor(89 / 30) = 2 variants
      // Multiple supports floor(30 / 10) = 3 variants
      // Supported disjoint variants = min(2, 3) = 2
      expect(audit.supportedDisjointVariants).toBe(2);
      expect(audit.limitingType).toBe('single');

      // Target 5 variants:
      // Required: 5 * 30 = 150 single, 5 * 10 = 50 multiple
      // Missing: 150 - 89 = 61 single, 50 - 30 = 20 multiple. Total = 81.
      expect(audit.missingFor5.missingSingle).toBe(61);
      expect(audit.missingFor5.missingMultiple).toBe(20);
      expect(audit.missingFor5.missingTotal).toBe(81);

      // Target 10 variants:
      // Required: 10 * 30 = 300 single, 10 * 10 = 100 multiple
      // Missing: 300 - 89 = 211 single, 100 - 30 = 70 multiple. Total = 281.
      expect(audit.missingFor10.missingSingle).toBe(211);
      expect(audit.missingFor10.missingMultiple).toBe(70);
      expect(audit.missingFor10.missingTotal).toBe(281);
    });
  });
});
