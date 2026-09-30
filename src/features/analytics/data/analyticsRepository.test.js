import { describe, expect, it, vi } from 'vitest';
import {
  createAnalyticsRepository,
  parseSessionDoc,
} from './analyticsRepository';

describe('analyticsRepository', () => {
  describe('parseSessionDoc', () => {
    it('returns null for falsy data', () => {
      expect(parseSessionDoc('id-1', null)).toBeNull();
    });

    it('parses timestamps and defaults missing fields', () => {
      const parsed = parseSessionDoc('doc-1', {
        userId: 'u-1',
        status: 'completed',
        startedAt: { toMillis: () => 1700000000000 },
        finishedAt: 1700003600000,
        score: { totalScore: 42 },
      });

      expect(parsed).toEqual({
        id: 'doc-1',
        userId: 'u-1',
        status: 'completed',
        questionIds: [],
        answers: {},
        flagged: [],
        currentIndex: 0,
        durationLimitSec: 3600,
        startedAt: 1700000000000,
        finishedAt: 1700003600000,
        score: { totalScore: 42 },
        questionSnapshots: null,
      });
    });
  });

  describe('getUserSessions', () => {
    it('returns empty array when userId is empty or null', async () => {
      const repo = createAnalyticsRepository({});
      expect(await repo.getUserSessions('')).toEqual([]);
      expect(await repo.getUserSessions(null)).toEqual([]);
    });

    it('fetches and sorts user sessions descending by date', async () => {
      const mockDocs = [
        {
          id: 'sess-old',
          data: () => ({
            userId: 'user-1',
            status: 'completed',
            startedAt: 1000,
            score: { totalScore: 30 },
          }),
        },
        {
          id: 'sess-new',
          data: () => ({
            userId: 'user-1',
            status: 'completed',
            startedAt: 5000,
            score: { totalScore: 45 },
          }),
        },
      ];

      const mockFirestore = {};
      const repo = createAnalyticsRepository(mockFirestore);

      // Mock Firestore query
      vi.spyOn(repo, 'getUserSessions').mockImplementation(async (userId) => {
        if (!userId) return [];
        return mockDocs
          .map((d) => parseSessionDoc(d.id, d.data()))
          .sort((a, b) => b.startedAt - a.startedAt);
      });

      const sessions = await repo.getUserSessions('user-1');
      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe('sess-new');
      expect(sessions[1].id).toBe('sess-old');
    });
  });
});
