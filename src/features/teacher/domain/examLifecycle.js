export const EXAM_STATUS = Object.freeze({
  DRAFT: 'draft',
  WAITING: 'waiting',
  ACTIVE: 'active',
  FINISHED: 'finished',
});

const ALLOWED_TRANSITIONS = {
  [EXAM_STATUS.DRAFT]: [EXAM_STATUS.WAITING, EXAM_STATUS.ACTIVE],
  [EXAM_STATUS.WAITING]: [
    EXAM_STATUS.DRAFT,
    EXAM_STATUS.ACTIVE,
    EXAM_STATUS.FINISHED,
  ],
  [EXAM_STATUS.ACTIVE]: [EXAM_STATUS.FINISHED],
  [EXAM_STATUS.FINISHED]: [], // Terminal state
};

/**
 * Checks if a transition between exam statuses is valid.
 *
 * @param {string} fromStatus
 * @param {string} toStatus
 * @returns {boolean}
 */
export function canTransitionExamStatus(fromStatus, toStatus) {
  if (!fromStatus || !toStatus || fromStatus === toStatus) {
    return false;
  }
  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  return Array.isArray(allowed) && allowed.includes(toStatus);
}

/**
 * Transitions an exam to a new status with validation and timestamps.
 *
 * @param {object} exam
 * @param {string} nextStatus
 * @param {object} [options]
 * @param {number|(() => number)} [options.now=Date.now]
 * @returns {object} Updated exam object.
 */
export function transitionExamStatus(exam, nextStatus, { now = Date.now } = {}) {
  if (!exam || typeof exam !== 'object') {
    throw new Error('Экзамен обязателен для изменения статуса.');
  }

  const currentStatus = exam.status || EXAM_STATUS.DRAFT;

  if (!canTransitionExamStatus(currentStatus, nextStatus)) {
    throw new Error(
      `Недопустимый переход статуса экзамена с "${currentStatus}" на "${nextStatus}".`
    );
  }

  const currentTime = typeof now === 'function' ? now() : now;
  const updated = {
    ...exam,
    status: nextStatus,
    updatedAt: currentTime,
  };

  if (nextStatus === EXAM_STATUS.ACTIVE && !exam.startsAt) {
    updated.startsAt = currentTime;
    const durationSec = exam.durationSeconds || 3600;
    updated.endsAt = currentTime + durationSec * 1000;
  } else if (nextStatus === EXAM_STATUS.FINISHED) {
    updated.finishedAt = currentTime;
    if (!updated.endsAt) {
      updated.endsAt = currentTime;
    }
  }

  return Object.freeze(updated);
}
