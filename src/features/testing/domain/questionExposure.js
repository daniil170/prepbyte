/**
 * Pure domain module managing student question exposure and novelty tracking.
 *
 * Exposure dictionary schema:
 * {
 *   [questionId: string]: {
 *     timesSeen: number,
 *     lastSeenAt: number // epoch ms
 *   }
 * }
 */

/**
 * Determines which questions in a session the student actually engaged with.
 * - Completed sessions: student engaged with all questions.
 * - In-progress or abandoned sessions: only questions with non-empty answers or bookmarks (flags).
 *
 * @param {object} session
 * @returns {string[]} Array of engaged question IDs.
 */
export function getEngagedQuestionIds(session) {
  if (!session || typeof session !== 'object') {
    return [];
  }

  const questionIds = Array.isArray(session.questionIds)
    ? session.questionIds
    : [];
  if (questionIds.length === 0) {
    return [];
  }

  if (session.status === 'completed') {
    return [...questionIds];
  }

  const flaggedSet = new Set(
    Array.isArray(session.flagged) ? session.flagged : []
  );
  const answers =
    session.answers && typeof session.answers === 'object'
      ? session.answers
      : {};

  return questionIds.filter((id) => {
    const ans = answers[id];
    const hasAnswer = Array.isArray(ans) ? ans.length > 0 : Boolean(ans);
    const isFlagged = flaggedSet.has(id);
    return hasAnswer || isFlagged;
  });
}

/**
 * Builds an exposure record by aggregating all engaged questions across a list of sessions.
 *
 * @param {Array<object>} sessions - List of session documents/entities.
 * @returns {Record<string, { timesSeen: number, lastSeenAt: number }>}
 */
export function buildExposureFromSessions(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {};
  }

  const exposure = {};

  for (const session of sessions) {
    if (!session || typeof session !== 'object') continue;

    const sessionTime = Number(
      session.finishedAt ?? session.startedAt ?? Date.now()
    );
    const engagedIds = getEngagedQuestionIds(session);

    for (const qId of engagedIds) {
      if (!qId || typeof qId !== 'string') continue;

      if (!exposure[qId]) {
        exposure[qId] = {
          timesSeen: 1,
          lastSeenAt: sessionTime,
        };
      } else {
        exposure[qId] = {
          timesSeen: exposure[qId].timesSeen + 1,
          lastSeenAt: Math.max(exposure[qId].lastSeenAt, sessionTime),
        };
      }
    }
  }

  return exposure;
}

/**
 * Immutably applies a new question assignment (e.g. at the start of a variant) to exposure.
 * Increments timesSeen by 1 and sets lastSeenAt to now.
 *
 * @param {Record<string, { timesSeen: number, lastSeenAt: number }>|null} exposure
 * @param {string[]} questionIds - Questions assigned to the new variant.
 * @param {number} [now=Date.now()] - Timestamp of assignment.
 * @returns {Record<string, { timesSeen: number, lastSeenAt: number }>} New exposure object.
 */
export function applyAssignment(exposure, questionIds, now = Date.now()) {
  const current = exposure && typeof exposure === 'object' ? exposure : {};
  const next = { ...current };

  if (!Array.isArray(questionIds)) {
    return next;
  }

  const timestamp = typeof now === 'number' ? now : Date.now();

  for (const qId of questionIds) {
    if (!qId || typeof qId !== 'string') continue;
    const existing = current[qId];
    next[qId] = {
      timesSeen: (existing?.timesSeen || 0) + 1,
      lastSeenAt: timestamp,
    };
  }

  return next;
}

/**
 * Releases unengaged questions from an abandoned session so an instant restart
 * does not unfairly count unseen questions as "seen".
 * Decrements timesSeen by 1 for unengaged questions and purges entries that reach 0.
 *
 * @param {Record<string, { timesSeen: number, lastSeenAt: number }>|null} exposure
 * @param {object} session - Abandoned session being cleaned up.
 * @returns {Record<string, { timesSeen: number, lastSeenAt: number }>} New exposure object.
 */
export function releaseUnengaged(exposure, session) {
  const current = exposure && typeof exposure === 'object' ? exposure : {};
  if (!session || !Array.isArray(session.questionIds)) {
    return { ...current };
  }

  const engagedSet = new Set(getEngagedQuestionIds(session));
  const unengagedIds = session.questionIds.filter((id) => !engagedSet.has(id));

  const next = { ...current };

  for (const qId of unengagedIds) {
    if (!next[qId]) continue;

    const remainingTimesSeen = next[qId].timesSeen - 1;
    if (remainingTimesSeen <= 0) {
      delete next[qId];
    } else {
      next[qId] = {
        timesSeen: remainingTimesSeen,
        lastSeenAt: next[qId].lastSeenAt,
      };
    }
  }

  return next;
}
