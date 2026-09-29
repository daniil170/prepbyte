const VALID_STATUSES = new Set(['in_progress', 'completed', 'abandoned']);

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

/**
 * Maps a Firestore document data object to a pure TestSession domain entity.
 *
 * @param {string} id - Document ID.
 * @param {Record<string, unknown>} data - Raw document data.
 * @returns {object} TestSession entity.
 * @throws {Error} When required document structure is missing or corrupt.
 */
export function documentToSession(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error(
      'Некорректный идентификатор сессии: id должен быть непустой строкой.'
    );
  }

  if (!data || typeof data !== 'object') {
    throw new Error(
      `Некорректный документ сессии (id: "${id}"). Данные документа отсутствуют.`
    );
  }

  const { userId, status, questionIds } = data;

  if (!userId || typeof userId !== 'string') {
    throw new Error(
      `Некорректный документ сессии (id: "${id}"). Поле userId должно быть непустой строкой.`
    );
  }

  if (!status || !VALID_STATUSES.has(status)) {
    throw new Error(
      `Некорректный документ сессии (id: "${id}"). Недопустимый статус: "${status}".`
    );
  }

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw new Error(
      `Некорректный документ сессии (id: "${id}"). Поле questionIds должно быть непустым массивом.`
    );
  }

  const startedAt = parseTimestamp(data.startedAt);
  if (startedAt === null) {
    throw new Error(
      `Некорректный документ сессии (id: "${id}"). Поле startedAt содержит некорректную временную метку.`
    );
  }

  const finishedAt = parseTimestamp(data.finishedAt);

  const answers =
    data.answers &&
    typeof data.answers === 'object' &&
    !Array.isArray(data.answers)
      ? data.answers
      : {};

  const flagged = Array.isArray(data.flagged) ? data.flagged : [];
  const currentIndex =
    typeof data.currentIndex === 'number' && data.currentIndex >= 0
      ? Math.floor(data.currentIndex)
      : 0;

  const durationLimitSec =
    typeof data.durationLimitSec === 'number' && data.durationLimitSec > 0
      ? data.durationLimitSec
      : 3600;

  return {
    id,
    userId,
    status,
    questionIds,
    answers,
    flagged,
    currentIndex,
    durationLimitSec,
    startedAt,
    finishedAt,
  };
}

/**
 * Maps a domain TestSession to a plain Firestore-compatible document representation.
 *
 * @param {object} session - Domain session entity.
 * @param {object} [options]
 * @param {*} [options.startedAtTimestamp]
 * @param {*} [options.finishedAtTimestamp]
 * @param {*} [options.updatedAtTimestamp]
 * @returns {Record<string, unknown>}
 */
export function sessionToDocument(
  session,
  { startedAtTimestamp, finishedAtTimestamp, updatedAtTimestamp } = {}
) {
  if (!session || typeof session !== 'object') {
    throw new Error('Сессия должна быть объектом.');
  }

  return {
    userId: session.userId,
    status: session.status,
    questionIds: session.questionIds,
    answers: session.answers || {},
    flagged: session.flagged || [],
    currentIndex: session.currentIndex ?? 0,
    durationLimitSec: session.durationLimitSec ?? 3600,
    startedAt: startedAtTimestamp ?? session.startedAt,
    finishedAt: finishedAtTimestamp ?? session.finishedAt ?? null,
    ...(updatedAtTimestamp !== undefined
      ? { updatedAt: updatedAtTimestamp }
      : {}),
  };
}
