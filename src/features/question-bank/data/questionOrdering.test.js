import { describe, expect, it } from 'vitest';
import { orderQuestionsByIds } from './questionOrdering';

describe('orderQuestionsByIds', () => {
  it('returns empty array when requestedIds is empty or not an array', () => {
    expect(orderQuestionsByIds([], [])).toEqual([]);
    expect(orderQuestionsByIds([{ id: 'q1' }], [])).toEqual([]);
    expect(orderQuestionsByIds([{ id: 'q1' }], null)).toEqual([]);
    expect(orderQuestionsByIds([{ id: 'q1' }], undefined)).toEqual([]);
  });

  it('orders questions in the requested ID order', () => {
    const questions = [
      { id: 'q-3', text: 'three' },
      { id: 'q-1', text: 'one' },
      { id: 'q-2', text: 'two' },
    ];
    const requested = ['q-2', 'q-3', 'q-1'];

    const result = orderQuestionsByIds(questions, requested);

    expect(result).toEqual([
      { id: 'q-2', text: 'two' },
      { id: 'q-3', text: 'three' },
      { id: 'q-1', text: 'one' },
    ]);
  });

  it('throws an error listing missing IDs when some questions are not found', () => {
    const questions = [
      { id: 'q-1', text: 'one' },
      { id: 'q-3', text: 'three' },
    ];
    const requested = ['q-1', 'q-2', 'q-3', 'q-4'];

    expect(() => orderQuestionsByIds(questions, requested)).toThrow(
      'Вопросы со следующими ID не найдены: q-2, q-4'
    );
  });

  it('throws an error when all requested questions are missing', () => {
    expect(() => orderQuestionsByIds([], ['missing-1', 'missing-2'])).toThrow(
      'Вопросы со следующими ID не найдены: missing-1, missing-2'
    );
  });
});
