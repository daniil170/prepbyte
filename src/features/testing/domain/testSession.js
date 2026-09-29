import { TEST_DURATION_SEC } from './testConfig';

function resolveTime(now) {
  if (typeof now === 'function') {
    return now();
  }
  return typeof now === 'number' ? now : Date.now();
}

/**
 * Creates a new test session in 'in_progress' status.
 *
 * @param {object} params
 * @param {string} params.id - Session unique ID.
 * @param {string} params.userId - Authenticated user ID.
 * @param {string[]} params.questionIds - 40 ordered question IDs.
 * @param {number} [params.durationLimitSec=3600] - Session duration in seconds.
 * @param {number|(() => number)} [params.now=Date.now] - Clock injector.
 * @returns {object} Immutable session object.
 */
export function createSession({
  id,
  userId,
  questionIds,
  durationLimitSec = TEST_DURATION_SEC,
  now = Date.now,
}) {
  if (!id || typeof id !== 'string') {
    throw new Error('Параметр id обязателен для создания сессии.');
  }
  if (!userId || typeof userId !== 'string') {
    throw new Error('Параметр userId обязателен для создания сессии.');
  }
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw new Error(
      'Параметр questionIds должен быть непустым массивом идентификаторов.'
    );
  }

  const startedAt = resolveTime(now);

  return Object.freeze({
    id,
    userId,
    status: 'in_progress',
    questionIds: [...questionIds],
    answers: {},
    flagged: [],
    currentIndex: 0,
    durationLimitSec,
    startedAt,
    finishedAt: null,
  });
}

/**
 * Selects an option index for a question.
 * In single-choice mode, replaces previous answer.
 * In multi-choice mode, toggles the option index, maintaining sorted uniqueness.
 * Ignored if session is not 'in_progress'.
 *
 * @param {object} session
 * @param {string} questionId
 * @param {number} optionIndex
 * @param {object} [options]
 * @param {boolean} [options.multiple=false]
 * @returns {object} New session object.
 */
export function selectAnswer(
  session,
  questionId,
  optionIndex,
  { multiple = false } = {}
) {
  if (!session || session.status !== 'in_progress') {
    return session;
  }
  if (!session.questionIds.includes(questionId)) {
    return session;
  }
  if (typeof optionIndex !== 'number' || optionIndex < 0) {
    return session;
  }

  const currentAnswers = session.answers[questionId] || [];
  let updatedOptions;

  if (multiple) {
    if (currentAnswers.includes(optionIndex)) {
      updatedOptions = currentAnswers.filter((idx) => idx !== optionIndex);
    } else {
      updatedOptions = [...currentAnswers, optionIndex];
    }
    updatedOptions.sort((a, b) => a - b);
  } else {
    updatedOptions = [optionIndex];
  }

  return Object.freeze({
    ...session,
    answers: {
      ...session.answers,
      [questionId]: updatedOptions,
    },
  });
}

/**
 * Toggles review flag for a question.
 * Ignored if session is not 'in_progress'.
 *
 * @param {object} session
 * @param {string} questionId
 * @returns {object} New session object.
 */
export function toggleFlag(session, questionId) {
  if (!session || session.status !== 'in_progress') {
    return session;
  }
  if (!session.questionIds.includes(questionId)) {
    return session;
  }

  const isFlagged = session.flagged.includes(questionId);
  const newFlagged = isFlagged
    ? session.flagged.filter((id) => id !== questionId)
    : [...session.flagged, questionId];

  return Object.freeze({
    ...session,
    flagged: newFlagged,
  });
}

/**
 * Changes current question index, clamped within [0, questionIds.length - 1].
 * Ignored if session is not 'in_progress'.
 *
 * @param {object} session
 * @param {number} index
 * @returns {object} New session object.
 */
export function goToQuestion(session, index) {
  if (!session || session.status !== 'in_progress') {
    return session;
  }
  if (typeof index !== 'number' || Number.isNaN(index)) {
    return session;
  }
  if (session.questionIds.length === 0) {
    return session;
  }

  const clampedIndex = Math.max(
    0,
    Math.min(Math.floor(index), session.questionIds.length - 1)
  );

  if (clampedIndex === session.currentIndex) {
    return session;
  }

  return Object.freeze({
    ...session,
    currentIndex: clampedIndex,
  });
}

/**
 * Completes an in-progress session.
 *
 * @param {object} session
 * @param {number|(() => number)} [now=Date.now]
 * @returns {object} New session object.
 */
export function finishSession(session, now = Date.now) {
  if (!session || session.status !== 'in_progress') {
    return session;
  }

  return Object.freeze({
    ...session,
    status: 'completed',
    finishedAt: resolveTime(now),
  });
}

/**
 * Abandons an in-progress session.
 *
 * @param {object} session
 * @returns {object} New session object.
 */
export function abandonSession(session) {
  if (!session || session.status !== 'in_progress') {
    return session;
  }

  return Object.freeze({
    ...session,
    status: 'abandoned',
  });
}

/**
 * Computes absolute deadline timestamp in milliseconds.
 *
 * @param {object} session
 * @returns {number} Deadline in epoch ms.
 */
export function getDeadline(session) {
  if (!session || typeof session.startedAt !== 'number') {
    return 0;
  }
  return session.startedAt + session.durationLimitSec * 1000;
}

/**
 * Returns remaining seconds until session expiration (never negative).
 *
 * @param {object} session
 * @param {number|(() => number)} [now=Date.now]
 * @returns {number} Remaining seconds.
 */
export function getRemainingSeconds(session, now = Date.now) {
  if (!session) {
    return 0;
  }
  const currentTime = resolveTime(now);
  const deadline = getDeadline(session);
  const diffMs = deadline - currentTime;
  return Math.max(0, Math.ceil(diffMs / 1000));
}

/**
 * Checks whether the session timer has expired.
 *
 * @param {object} session
 * @param {number|(() => number)} [now=Date.now]
 * @returns {boolean}
 */
export function isExpired(session, now = Date.now) {
  return getRemainingSeconds(session, now) === 0;
}

/**
 * Counts how many questions have at least one chosen answer option.
 *
 * @param {object} session
 * @returns {number}
 */
export function countAnswered(session) {
  if (!session || !session.answers || !Array.isArray(session.questionIds)) {
    return 0;
  }

  let count = 0;
  for (const qId of session.questionIds) {
    const chosen = session.answers[qId];
    if (Array.isArray(chosen) && chosen.length > 0) {
      count++;
    }
  }
  return count;
}

/**
 * Returns the navigation status for question at given index.
 *
 * @param {object} session
 * @param {number} index
 * @returns {{ answered: boolean, flagged: boolean, current: boolean }}
 */
export function getQuestionStatus(session, index) {
  if (!session || !Array.isArray(session.questionIds)) {
    return { answered: false, flagged: false, current: false };
  }

  const questionId = session.questionIds[index];
  if (!questionId) {
    return { answered: false, flagged: false, current: false };
  }

  const answers = session.answers ? session.answers[questionId] : undefined;
  const answered = Array.isArray(answers) && answers.length > 0;
  const flagged = Array.isArray(session.flagged)
    ? session.flagged.includes(questionId)
    : false;
  const current = session.currentIndex === index;

  return { answered, flagged, current };
}
