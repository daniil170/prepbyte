/**
 * Pure mappers between Firestore question_exposure documents and domain exposure entities.
 */

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
 * Maps a Firestore document data object to a pure exposure dictionary entity.
 *
 * @param {string} id - Document ID (userId).
 * @param {Record<string, unknown>} data - Raw document payload.
 * @returns {Record<string, { timesSeen: number, lastSeenAt: number }>} Pure exposure entity.
 * @throws {Error} When required document structure is missing or corrupt (containing document ID).
 */
export function documentToExposure(id, data) {
  if (!id || typeof id !== 'string') {
    throw new Error(
      'Некорректный идентификатор документа экспозиции: id должен быть строкой.'
    );
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(
      `Некорректный документ экспозиции (id: "${id}"). Данные документа отсутствуют.`
    );
  }

  const { questions } = data;

  if (!questions || typeof questions !== 'object' || Array.isArray(questions)) {
    throw new Error(
      `Некорректный документ экспозиции (id: "${id}"). Поле questions должно быть объектом.`
    );
  }

  const exposure = {};

  for (const [qId, entry] of Object.entries(questions)) {
    if (!qId || typeof qId !== 'string') continue;

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(
        `Некорректный документ экспозиции (id: "${id}"). Запись вопроса "${qId}" повреждена.`
      );
    }

    const timesSeen =
      typeof entry.timesSeen === 'number' && entry.timesSeen >= 0
        ? Math.floor(entry.timesSeen)
        : null;

    if (timesSeen === null) {
      throw new Error(
        `Некорректный документ экспозиции (id: "${id}"). Поле timesSeen для вопроса "${qId}" некорректно.`
      );
    }

    const lastSeenAt = parseTimestamp(entry.lastSeenAt);

    exposure[qId] = {
      timesSeen,
      lastSeenAt: lastSeenAt ?? 0,
    };
  }

  return exposure;
}

/**
 * Maps domain exposure dictionary to a Firestore-compatible document representation.
 *
 * @param {string} userId - Owner UID.
 * @param {Record<string, { timesSeen: number, lastSeenAt: number }>} exposure
 * @param {object} [options]
 * @param {*} [options.updatedAtTimestamp]
 * @returns {Record<string, unknown>}
 */
export function exposureToDocument(
  userId,
  exposure,
  { updatedAtTimestamp } = {}
) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId обязателен для сохранения документа экспозиции.');
  }

  const questions = {};
  if (exposure && typeof exposure === 'object' && !Array.isArray(exposure)) {
    for (const [qId, entry] of Object.entries(exposure)) {
      if (!entry || typeof entry !== 'object') continue;
      questions[qId] = {
        timesSeen: typeof entry.timesSeen === 'number' ? entry.timesSeen : 1,
        lastSeenAt:
          typeof entry.lastSeenAt === 'number' ? entry.lastSeenAt : Date.now(),
      };
    }
  }

  return {
    userId,
    questions,
    ...(updatedAtTimestamp !== undefined
      ? { updatedAt: updatedAtTimestamp }
      : {}),
  };
}
