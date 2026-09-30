import { collection, getDocs, query, where } from 'firebase/firestore';
import { db as defaultDb } from '@infrastructure/firebase/firestore';

function parseTimestamp(ts) {
  if (ts === null || ts === undefined) {
    return null;
  }
  if (typeof ts === 'number' && !Number.isNaN(ts)) {
    return ts;
  }
  if (typeof ts.toMillis === 'function') {
    return ts.toMillis();
  }
  if (typeof ts.seconds === 'number') {
    return ts.seconds * 1000 + Math.round((ts.nanoseconds || 0) / 1000000);
  }
  return null;
}

export function parseSessionDoc(id, data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return {
    id,
    userId: data.userId || '',
    status: data.status || 'in_progress',
    questionIds: Array.isArray(data.questionIds) ? data.questionIds : [],
    answers:
      data.answers && typeof data.answers === 'object' ? data.answers : {},
    flagged: Array.isArray(data.flagged) ? data.flagged : [],
    currentIndex: typeof data.currentIndex === 'number' ? data.currentIndex : 0,
    durationLimitSec:
      typeof data.durationLimitSec === 'number' ? data.durationLimitSec : 3600,
    startedAt: parseTimestamp(data.startedAt),
    finishedAt: parseTimestamp(data.finishedAt),
    score: data.score && typeof data.score === 'object' ? data.score : null,
    questionSnapshots: Array.isArray(data.questionSnapshots)
      ? data.questionSnapshots
      : null,
  };
}

export function createAnalyticsRepository(firestore = defaultDb) {
  const collectionName = 'test_sessions';

  async function getUserSessions(userId) {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return [];
    }

    const sessionsRef = collection(firestore, collectionName);
    const q = query(sessionsRef, where('userId', '==', userId.trim()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const sessions = snapshot.docs
      .map((docSnap) => parseSessionDoc(docSnap.id, docSnap.data()))
      .filter(Boolean);

    // Sort descending by startedAt in memory
    sessions.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
    return sessions;
  }

  return {
    getUserSessions,
  };
}

export const analyticsRepository = createAnalyticsRepository();
