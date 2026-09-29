import { describe, expect, it } from 'vitest';
import { createQuestionRepository } from './questionRepository';

describe('questionRepository', () => {
  it('returns null when id is invalid or empty', async () => {
    const repo = createQuestionRepository({});

    expect(await repo.getQuestionById('')).toBeNull();
    expect(await repo.getQuestionById(null)).toBeNull();
  });

  it('returns empty array when getQuestionsByIds receives empty or invalid list', async () => {
    const repo = createQuestionRepository({});

    expect(await repo.getQuestionsByIds([])).toEqual([]);
    expect(await repo.getQuestionsByIds(null)).toEqual([]);
    expect(await repo.getQuestionsByIds(undefined)).toEqual([]);
  });

  it('rejects getQuestionsByTopics with empty topicIds', async () => {
    const repo = createQuestionRepository({});

    await expect(repo.getQuestionsByTopics([])).rejects.toThrow(
      'Параметр topicIds должен быть непустым массивом.'
    );
    await expect(repo.getQuestionsByTopics(null)).rejects.toThrow(
      'Параметр topicIds должен быть непустым массивом.'
    );
  });

  it('rejects getQuestionsByTopics when topicIds exceeds 30 items', async () => {
    const repo = createQuestionRepository({});
    const tooMany = Array.from({ length: 31 }, (_, i) => `topic_${i}`);

    await expect(repo.getQuestionsByTopics(tooMany)).rejects.toThrow(
      'Запрос Firestore "in" поддерживает максимум 30 тем, получено: 31.'
    );
  });
});
