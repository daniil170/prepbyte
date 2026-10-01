import { describe, expect, it } from 'vitest';
import { buildTestVariant } from './testVariantBuilder';
import { TEST_QUESTION_COUNT } from './testConfig';
import { applyAssignment } from './questionExposure';

function createSeededRandom(seed = 42) {
  let current = seed;
  return function () {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

describe('buildTestVariant', () => {
  it('throws an error when question bank has fewer questions than requested count', () => {
    const questions = Array.from({ length: 39 }, (_, i) => ({
      id: `q-${i}`,
      topic: 'python_loops',
    }));

    expect(() => buildTestVariant(questions)).toThrow(
      'Недостаточно вопросов в банке: доступно 39, требуется 40.'
    );
  });

  it('throws an error when questions argument is not an array', () => {
    expect(() => buildTestVariant(null)).toThrow(
      'Вопросы должны быть переданы массивом.'
    );
  });

  it('returns exactly TEST_QUESTION_COUNT (40) unique question IDs by default with empty exposure', () => {
    const questions = Array.from({ length: 60 }, (_, i) => ({
      id: `q-${i}`,
      topic: `topic_${i % 5}`,
    }));

    const result = buildTestVariant(questions);

    expect(result.questionIds).toHaveLength(TEST_QUESTION_COUNT);
    expect(result.newQuestionCount).toBe(TEST_QUESTION_COUNT);
    const uniqueIds = new Set(result.questionIds);
    expect(uniqueIds.size).toBe(TEST_QUESTION_COUNT);
  });

  it('contains no duplicate IDs in the assembled variant', () => {
    const questions = Array.from({ length: 100 }, (_, i) => ({
      id: `q-${i}`,
      topic: `topic_${i % 10}`,
    }));

    const { questionIds } = buildTestVariant(questions, { count: 40 });
    const set = new Set(questionIds);
    expect(set.size).toBe(questionIds.length);
  });

  it('is completely deterministic when provided with a seeded random function', () => {
    const questions = Array.from({ length: 80 }, (_, i) => ({
      id: `q-${i}`,
      topic: `topic_${i % 4}`,
    }));

    const rng1 = createSeededRandom(12345);
    const result1 = buildTestVariant(questions, { count: 40, random: rng1 });

    const rng2 = createSeededRandom(12345);
    const result2 = buildTestVariant(questions, { count: 40, random: rng2 });

    expect(result1).toEqual(result2);
  });

  it('maintains structure: 30 single-choice (1-30) and 10 multi-choice (31-40) questions when pools suffice', () => {
    const questions = [];
    for (let i = 0; i < 50; i++) {
      questions.push({
        id: `single-${i}`,
        topic: `topic_${i % 5}`,
        correctAnswers: [0], // single choice
      });
    }
    for (let i = 0; i < 20; i++) {
      questions.push({
        id: `multi-${i}`,
        topic: `topic_${i % 5}`,
        correctAnswers: [0, 1], // multiple choice
      });
    }

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const { questionIds, newQuestionCount } = buildTestVariant(questions);

    expect(questionIds).toHaveLength(40);
    expect(newQuestionCount).toBe(40);

    // Questions 1 to 30 (indices 0 to 29) must all be single-choice
    const first30 = questionIds.slice(0, 30);
    first30.forEach((id) => {
      const q = questionMap.get(id);
      expect(q.correctAnswers).toHaveLength(1);
    });

    // Questions 31 to 40 (indices 30 to 39) must all be multiple-choice
    const last10 = questionIds.slice(30, 40);
    last10.forEach((id) => {
      const q = questionMap.get(id);
      expect(q.correctAnswers.length).toBeGreaterThan(1);
    });
  });

  it('selects unseen questions before any seen question', () => {
    const questions = [];
    // 35 single questions: 30 unseen, 5 seen
    for (let i = 0; i < 35; i++) {
      questions.push({
        id: `single-${i}`,
        topic: 'topic_1',
        multiple: false,
      });
    }
    // 12 multiple questions: 10 unseen, 2 seen
    for (let i = 0; i < 12; i++) {
      questions.push({
        id: `multi-${i}`,
        topic: 'topic_2',
        multiple: true,
      });
    }

    // Mark 5 single and 2 multi as seen
    const exposure = {
      'single-0': { timesSeen: 2, lastSeenAt: 1000 },
      'single-1': { timesSeen: 1, lastSeenAt: 1000 },
      'single-2': { timesSeen: 3, lastSeenAt: 1000 },
      'single-3': { timesSeen: 1, lastSeenAt: 1000 },
      'single-4': { timesSeen: 2, lastSeenAt: 1000 },
      'multi-0': { timesSeen: 1, lastSeenAt: 1000 },
      'multi-1': { timesSeen: 2, lastSeenAt: 1000 },
    };

    const { questionIds, newQuestionCount } = buildTestVariant(questions, {
      exposure,
    });

    expect(newQuestionCount).toBe(40);
    // Since exactly 30 single and 10 multi unseen questions existed, NONE of the seen questions should be picked!
    for (let i = 0; i < 5; i++) {
      expect(questionIds).not.toContain(`single-${i}`);
    }
    for (let i = 0; i < 2; i++) {
      expect(questionIds).not.toContain(`multi-${i}`);
    }
  });

  it('selects least-seen questions first, then oldest seen questions when seen questions must be picked', () => {
    // 30 single questions needed. Only 28 unseen questions available + 4 seen questions.
    const questions = [];
    for (let i = 0; i < 28; i++) {
      questions.push({ id: `unseen-s-${i}`, topic: 't1', multiple: false });
    }
    questions.push({ id: `seen-rare-old`, topic: 't1', multiple: false }); // timesSeen: 1, lastSeenAt: 1000
    questions.push({ id: `seen-rare-recent`, topic: 't1', multiple: false }); // timesSeen: 1, lastSeenAt: 2000
    questions.push({ id: `seen-frequent-old`, topic: 't1', multiple: false }); // timesSeen: 3, lastSeenAt: 500
    questions.push({
      id: `seen-frequent-recent`,
      topic: 't1',
      multiple: false,
    }); // timesSeen: 4, lastSeenAt: 3000

    // 10 multiple questions (all unseen)
    for (let i = 0; i < 10; i++) {
      questions.push({ id: `multi-${i}`, topic: 't2', multiple: true });
    }

    const exposure = {
      'seen-rare-old': { timesSeen: 1, lastSeenAt: 1000 },
      'seen-rare-recent': { timesSeen: 1, lastSeenAt: 2000 },
      'seen-frequent-old': { timesSeen: 3, lastSeenAt: 500 },
      'seen-frequent-recent': { timesSeen: 4, lastSeenAt: 3000 },
    };

    const { questionIds, newQuestionCount } = buildTestVariant(questions, {
      exposure,
    });

    expect(newQuestionCount).toBe(38); // 28 single unseen + 10 multi unseen
    // Must have chosen the 2 least-seen questions: seen-rare-old and seen-rare-recent!
    expect(questionIds).toContain('seen-rare-old');
    expect(questionIds).toContain('seen-rare-recent');
    // More frequently seen questions should NOT have been selected
    expect(questionIds).not.toContain('seen-frequent-old');
    expect(questionIds).not.toContain('seen-frequent-recent');
  });

  it('respects per-topic cap during initial selection phase', () => {
    // 3 topics for single choice:
    // Topic A: 30 questions
    // Topic B: 5 questions
    // Topic C: 5 questions
    // Total quota = 30 single questions.
    // topicsInPool = 3. Cap = ceil(30 / 3) + 1 = 11 questions.
    const questions = [];
    for (let i = 0; i < 30; i++)
      questions.push({ id: `a-${i}`, topic: 'topA', multiple: false });
    for (let i = 0; i < 5; i++)
      questions.push({ id: `b-${i}`, topic: 'topB', multiple: false });
    for (let i = 0; i < 5; i++)
      questions.push({ id: `c-${i}`, topic: 'topC', multiple: false });
    // 10 multiple questions
    for (let i = 0; i < 10; i++)
      questions.push({ id: `m-${i}`, topic: 'topM', multiple: true });

    const { questionIds } = buildTestVariant(questions);

    // All available questions from B and C should be included before relaxing cap on A
    for (let i = 0; i < 5; i++) {
      expect(questionIds).toContain(`b-${i}`);
      expect(questionIds).toContain(`c-${i}`);
    }
  });

  describe('three consecutive variants simulation (bank of 89 single + 30 multiple)', () => {
    it('guarantees variants 1 and 2 share no questions, variant 3 repeats exactly 1 single and 0 multiple', () => {
      // Create real-sized bank: 89 single + 30 multiple across 14 topics
      const questions = [];
      for (let i = 0; i < 89; i++) {
        questions.push({
          id: `single-${i + 1}`,
          topic: `topic_${i % 14}`,
          multiple: false,
        });
      }
      for (let i = 0; i < 30; i++) {
        questions.push({
          id: `multi-${i + 1}`,
          topic: `topic_${i % 14}`,
          multiple: true,
        });
      }

      let exposure = {};

      // 1. Variant 1
      const v1 = buildTestVariant(questions, { exposure });
      expect(v1.questionIds).toHaveLength(40);
      expect(v1.newQuestionCount).toBe(40);

      // Record exposure from variant 1
      exposure = applyAssignment(exposure, v1.questionIds, 1000);

      // 2. Variant 2
      const v2 = buildTestVariant(questions, { exposure });
      expect(v2.questionIds).toHaveLength(40);
      expect(v2.newQuestionCount).toBe(40);

      // Verify variant 1 and variant 2 share ZERO questions!
      const setV1 = new Set(v1.questionIds);
      const overlapV1V2 = v2.questionIds.filter((id) => setV1.has(id));
      expect(overlapV1V2).toHaveLength(0);

      // Record exposure from variant 2
      exposure = applyAssignment(exposure, v2.questionIds, 2000);

      // 3. Variant 3
      const v3 = buildTestVariant(questions, { exposure });
      expect(v3.questionIds).toHaveLength(40);
      // In variant 3, 29 single unseen + 10 multiple unseen = 39 new questions!
      expect(v3.newQuestionCount).toBe(39);

      const allSeenPrior = new Set([...v1.questionIds, ...v2.questionIds]);
      const repeatedQuestions = v3.questionIds.filter((id) =>
        allSeenPrior.has(id)
      );

      // Exactly 1 question is repeated across the entire 40 questions!
      expect(repeatedQuestions).toHaveLength(1);

      // Check repeated question type: must be single-answer!
      const repeatedId = repeatedQuestions[0];
      expect(repeatedId).toMatch(/^single-/);

      // Check multiple-answer questions in variant 3: exactly 0 repeats!
      const v3MultiQuestions = v3.questionIds.filter((id) =>
        id.startsWith('multi-')
      );
      expect(v3MultiQuestions).toHaveLength(10);
      const repeatedMulti = v3MultiQuestions.filter((id) =>
        allSeenPrior.has(id)
      );
      expect(repeatedMulti).toHaveLength(0);
    });

    it('gives 0 repeats across 3 variants if bank has 90 single + 30 multiple', () => {
      const questions = [];
      for (let i = 0; i < 90; i++) {
        questions.push({
          id: `single-${i + 1}`,
          topic: `topic_${i % 14}`,
          multiple: false,
        });
      }
      for (let i = 0; i < 30; i++) {
        questions.push({
          id: `multi-${i + 1}`,
          topic: `topic_${i % 14}`,
          multiple: true,
        });
      }

      let exposure = {};

      const v1 = buildTestVariant(questions, { exposure });
      exposure = applyAssignment(exposure, v1.questionIds, 1000);

      const v2 = buildTestVariant(questions, { exposure });
      exposure = applyAssignment(exposure, v2.questionIds, 2000);

      const v3 = buildTestVariant(questions, { exposure });

      const set1 = new Set(v1.questionIds);
      const set2 = new Set(v2.questionIds);

      // Check overlap of v3 with prior variants: exactly 0!
      const repeats = v3.questionIds.filter(
        (id) => set1.has(id) || set2.has(id)
      );
      expect(repeats).toHaveLength(0);
      expect(v3.newQuestionCount).toBe(40);
    });
  });
});
