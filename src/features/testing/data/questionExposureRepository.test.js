import { describe, expect, it, vi } from 'vitest';
import { createQuestionExposureRepository } from './questionExposureRepository';

let mockSnapshot = {
  exists: () => false,
  id: '',
  data: () => ({}),
};

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    doc: vi.fn((_db, _col, id) => ({ id })),
    getDoc: vi.fn(async () => mockSnapshot),
    setDoc: vi.fn(async () => {}),
    serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
  };
});

describe('questionExposureRepository', () => {
  it('returns null when userId is invalid or document does not exist', async () => {
    mockSnapshot = {
      exists: () => false,
      id: '',
      data: () => ({}),
    };
    const repo = createQuestionExposureRepository({});

    expect(await repo.getExposure('')).toBeNull();
    expect(await repo.getExposure(null)).toBeNull();
    expect(await repo.getExposure('missing_user')).toBeNull();
  });

  it('retrieves and parses existing exposure document', async () => {
    mockSnapshot = {
      exists: () => true,
      id: 'user_abc',
      data: () => ({
        userId: 'user_abc',
        questions: {
          q1: { timesSeen: 2, lastSeenAt: 123456 },
        },
      }),
    };

    const repo = createQuestionExposureRepository({});
    const result = await repo.getExposure('user_abc');
    expect(result).toEqual({
      q1: { timesSeen: 2, lastSeenAt: 123456 },
    });
  });

  it('rejects saveExposure when userId is missing', async () => {
    const repo = createQuestionExposureRepository({});
    await expect(repo.saveExposure('', {})).rejects.toThrow(
      'userId обязателен для сохранения экспозиции.'
    );
  });
});
