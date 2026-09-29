import { describe, expect, it } from 'vitest';
import { createTestSessionRepository } from './testSessionRepository';

describe('testSessionRepository', () => {
  it('returns null when getSessionById is called with empty or invalid id', async () => {
    const repo = createTestSessionRepository({});

    expect(await repo.getSessionById('')).toBeNull();
    expect(await repo.getSessionById(null)).toBeNull();
    expect(await repo.getSessionById(undefined)).toBeNull();
  });

  it('returns null when getActiveSession is called with empty or invalid userId', async () => {
    const repo = createTestSessionRepository({});

    expect(await repo.getActiveSession('')).toBeNull();
    expect(await repo.getActiveSession(null)).toBeNull();
  });

  it('rejects startSession with incomplete session object', async () => {
    const repo = createTestSessionRepository({});

    await expect(repo.startSession(null)).rejects.toThrow(
      'Некорректный объект сессии для запуска.'
    );
    await expect(repo.startSession({ id: 's1' })).rejects.toThrow(
      'Некорректный объект сессии для запуска.'
    );
  });

  it('rejects saveProgress, finishSession and abandonSession without session id', async () => {
    const repo = createTestSessionRepository({});

    await expect(repo.saveProgress(null)).rejects.toThrow(
      'Не указан идентификатор сессии для сохранения.'
    );
    await expect(repo.finishSession(null)).rejects.toThrow(
      'Не указан идентификатор сессии для завершения.'
    );
    await expect(repo.abandonSession(null)).rejects.toThrow(
      'Не указан идентификатор сессии для отмены.'
    );
  });
});
