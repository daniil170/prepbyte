import { describe, expect, it, vi } from 'vitest';
import { createQuestionRepository } from './questionRepository';

vi.mock(import('firebase/firestore'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    collection: vi.fn(() => 'mock-collection'),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(),
    documentId: vi.fn(() => '__name__'),
    getDocs: vi.fn(async () => ({
      docs: [
        {
          id: 'q-test-1',
          data: () => ({
            topic: 'python_loops',
            questionText: 'What is a loop?',
            options: ['Option A', 'Option B'],
            difficulty: 'easy',
            correctAnswers: [0],
          }),
        },
      ],
    })),
  };
});

describe('questionRepository Security - getQuestionsByIds', () => {
  it('strictly excludes correctAnswers and explanation by default (students mode)', async () => {
    const repo = createQuestionRepository({});
    const questions = await repo.getQuestionsByIds(['q-test-1']);

    expect(questions).toHaveLength(1);
    expect(questions[0].id).toBe('q-test-1');
    expect(questions[0].questionText).toBe('What is a loop?');
    expect(questions[0].options).toEqual(['Option A', 'Option B']);
    // Students MUST NOT receive correctAnswers in the browser!
    expect(questions[0].correctAnswers).toBeUndefined();
    expect(questions[0].explanation).toBeUndefined();
  });
});
