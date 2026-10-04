export const EXAM_SESSION_STATUS = Object.freeze({
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  ABANDONED: 'abandoned',
  DISQUALIFIED: 'disqualified',
});

export const MAX_VIOLATIONS = 3;
export const MAX_ATTEMPTS = 3;

function resolveTime(now) {
  if (typeof now === 'function') {
    return now();
  }
  return typeof now === 'number' ? now : Date.now();
}

/**
 * Deterministic or random Fisher-Yates permutation for question IDs.
 *
 * @param {string[]} questionIds - Source array of question IDs.
 * @param {object} [options]
 * @param {() => number} [options.random=Math.random] - Injected RNG function.
 * @returns {string[]} Permuted array of question IDs.
 */
export function generateQuestionOrder(questionIds = [], { random = Math.random } = {}) {
  if (!Array.isArray(questionIds) || questionIds.length <= 1) {
    return Array.isArray(questionIds) ? [...questionIds] : [];
  }

  const result = [...questionIds];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Pure evaluation function for exam answers against question bank items.
 * Answers are evaluated strictly by question.id.
 *
 * @param {Record<string, number[]>} answers - Map of { [questionId]: optionIndices }.
 * @param {Array<object>} questions - Array of question entities.
 * @returns {object} Detailed score calculation.
 */
export function evaluateExamAnswers(answers = {}, questions = []) {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctAnswersCount = 0;
  const byTopicBreakdown = {};
  const detailedResults = [];

  for (const question of questions) {
    if (!question || !question.id) continue;
    const userAnswers = Array.isArray(answers[question.id])
      ? answers[question.id]
      : [];
    const userSet = new Set(userAnswers);
    const correctAnswers = Array.isArray(question.correctAnswers)
      ? question.correctAnswers
      : [];
    const correctSet = new Set(correctAnswers);
    const isMultipleChoice = correctSet.size > 1;
    const maxPoints = isMultipleChoice ? 2 : 1;

    let pointsAwarded = 0;
    if (!isMultipleChoice) {
      if (userSet.size === 1 && userSet.has(correctAnswers[0])) {
        pointsAwarded = 1;
      }
    } else {
      let omissions = 0;
      for (const ans of correctSet) {
        if (!userSet.has(ans)) omissions++;
      }
      let falsePositives = 0;
      for (const ans of userSet) {
        if (!correctSet.has(ans)) falsePositives++;
      }
      const totalErrors = omissions + falsePositives;
      if (totalErrors === 0) pointsAwarded = 2;
      else if (totalErrors === 1) pointsAwarded = 1;
      else pointsAwarded = 0;
    }

    const isCorrect = pointsAwarded === maxPoints;
    if (isCorrect) correctAnswersCount++;
    totalScore += pointsAwarded;
    maxPossibleScore += maxPoints;

    const topic = question.topic || 'unknown';
    if (!byTopicBreakdown[topic]) {
      byTopicBreakdown[topic] = {
        topic,
        score: 0,
        maxScore: 0,
        percentage: 0,
        totalQuestions: 0,
      };
    }
    byTopicBreakdown[topic].score += pointsAwarded;
    byTopicBreakdown[topic].maxScore += maxPoints;
    byTopicBreakdown[topic].totalQuestions += 1;

    detailedResults.push({
      id: question.id,
      topic,
      pointsAwarded,
      maxPoints,
      isCorrect,
    });
  }

  for (const topic of Object.keys(byTopicBreakdown)) {
    const entry = byTopicBreakdown[topic];
    entry.percentage =
      entry.maxScore > 0
        ? Math.round((entry.score / entry.maxScore) * 100)
        : 0;
  }

  const percentage =
    maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0;
  const passed = percentage >= 50;

  return {
    totalScore,
    maxPossibleScore,
    percentage,
    passed,
    correctAnswersCount,
    byTopicBreakdown,
    detailedResults,
  };
}

/**
 * Creates a new student exam session with persistent individual questionOrder.
 *
 * @param {object} params
 * @param {string} params.id - Session identifier (${examId}_${studentId}).
 * @param {string} params.examId
 * @param {string} params.studentId
 * @param {string} [params.studentName='']
 * @param {string} params.groupId
 * @param {string[]} [params.questionIds=[]] - Source exam question IDs.
 * @param {string[]} [params.questionOrder] - Pre-existing or custom question order.
 * @param {number} [params.durationSeconds=3600]
 * @param {string} [params.status='waiting']
 * @param {() => number} [params.random=Math.random] - Injected RNG function.
 * @param {number|(() => number)} [params.now=Date.now]
 * @returns {object} Immutable ExamSession.
 */
export function createExamSession({
  id,
  examId,
  studentId,
  studentName = '',
  groupId,
  questionIds = [],
  questionOrder,
  durationSeconds = 3600,
  status = EXAM_SESSION_STATUS.WAITING,
  attemptNumber = 1,
  violationCount = 0,
  maxViolations = MAX_VIOLATIONS,
  disqualifiedAt = null,
  disqualificationReason = null,
  random = Math.random,
  now = Date.now,
}) {
  if (!id || typeof id !== 'string') {
    throw new Error('Идентификатор id обязателен для создания сессии экзамена.');
  }
  if (!examId || typeof examId !== 'string') {
    throw new Error('Идентификатор examId обязателен.');
  }
  if (!studentId || typeof studentId !== 'string') {
    throw new Error('Идентификатор studentId обязателен.');
  }

  const currentTime = resolveTime(now);
  const isImmediatelyActive = status === EXAM_SESSION_STATUS.IN_PROGRESS;
  const startedAt = isImmediatelyActive ? currentTime : null;
  const expiresAt = isImmediatelyActive ? currentTime + durationSeconds * 1000 : null;

  // Persistent individual question order generated ONCE upon creation
  const effectiveQuestionOrder = Array.isArray(questionOrder) && questionOrder.length > 0
    ? [...questionOrder]
    : generateQuestionOrder(questionIds, { random });

  return Object.freeze({
    id,
    examId,
    studentId,
    studentName: (studentName || '').trim(),
    groupId: (groupId || '').trim(),
    questionOrder: effectiveQuestionOrder,
    status,
    attemptNumber: Number(attemptNumber) || 1,
    violationCount: Number(violationCount) || 0,
    maxViolations: Number(maxViolations) || MAX_VIOLATIONS,
    disqualifiedAt,
    disqualificationReason,
    durationSeconds,
    startedAt,
    expiresAt,
    submittedAt: null,
    answers: {},
    flagged: [],
    currentIndex: 0,
    score: null,
    correctAnswersCount: null,
    totalScore: null,
    maxPossibleScore: null,
    percentage: null,
    createdAt: currentTime,
    updatedAt: currentTime,
  });
}

/**
 * Starts a waiting exam session.
 *
 * @param {object} session
 * @param {object} [options]
 * @param {number} [options.durationSeconds]
 * @param {number|(() => number)} [options.now=Date.now]
 * @returns {object}
 */
export function startExamSession(
  session,
  { durationSeconds, now = Date.now } = {}
) {
  if (!session || session.status === EXAM_SESSION_STATUS.SUBMITTED) {
    return session;
  }

  const currentTime = resolveTime(now);
  const effectiveDuration =
    durationSeconds || session.durationSeconds || 3600;
  const expiresAt = currentTime + effectiveDuration * 1000;

  return Object.freeze({
    ...session,
    status: EXAM_SESSION_STATUS.IN_PROGRESS,
    durationSeconds: effectiveDuration,
    startedAt: session.startedAt || currentTime,
    expiresAt: session.expiresAt || expiresAt,
    updatedAt: currentTime,
  });
}

/**
 * Updates answers for a specific question in the session.
 *
 * @param {object} session
 * @param {string} questionId
 * @param {number[]} optionIndices
 * @param {object} [options]
 * @param {number|(() => number)} [options.now=Date.now]
 * @returns {object}
 */
export function updateExamSessionAnswer(
  session,
  questionId,
  optionIndices,
  { now = Date.now } = {}
) {
  if (
    !session ||
    session.status !== EXAM_SESSION_STATUS.IN_PROGRESS ||
    !questionId
  ) {
    return session;
  }

  const rawIndices = Array.isArray(optionIndices) ? optionIndices : [];
  const cleanIndices = rawIndices
    .filter((i) => typeof i === 'number' && Number.isInteger(i) && i >= 0)
    .sort((a, b) => a - b);

  return Object.freeze({
    ...session,
    answers: {
      ...session.answers,
      [questionId]: cleanIndices,
    },
    updatedAt: resolveTime(now),
  });
}

/**
 * Toggles a question flag state in the session.
 *
 * @param {object} session
 * @param {string} questionId
 * @param {object} [options]
 * @param {number|(() => number)} [options.now=Date.now]
 * @returns {object}
 */
export function toggleExamSessionFlag(
  session,
  questionId,
  { now = Date.now } = {}
) {
  if (
    !session ||
    session.status !== EXAM_SESSION_STATUS.IN_PROGRESS ||
    !questionId
  ) {
    return session;
  }

  const currentFlagged = Array.isArray(session.flagged) ? session.flagged : [];
  const isFlagged = currentFlagged.includes(questionId);
  const updatedFlagged = isFlagged
    ? currentFlagged.filter((id) => id !== questionId)
    : [...currentFlagged, questionId];

  return Object.freeze({
    ...session,
    flagged: updatedFlagged,
    updatedAt: resolveTime(now),
  });
}

/**
 * Submits an exam session, evaluates final score, and freezes state.
 *
 * @param {object} session
 * @param {Array<object>} questions
 * @param {object} [options]
 * @param {number|(() => number)} [options.now=Date.now]
 * @returns {object}
 */
export function submitExamSession(
  session,
  questions = [],
  { now = Date.now } = {}
) {
  if (!session || session.status === EXAM_SESSION_STATUS.SUBMITTED) {
    return session;
  }

  const currentTime = resolveTime(now);
  const scoreResult = evaluateExamAnswers(session.answers || {}, questions);

  return Object.freeze({
    ...session,
    status: EXAM_SESSION_STATUS.SUBMITTED,
    submittedAt: currentTime,
    score: scoreResult,
    totalScore: scoreResult.totalScore,
    maxPossibleScore: scoreResult.maxPossibleScore,
    percentage: scoreResult.percentage,
    correctAnswersCount: scoreResult.correctAnswersCount,
    updatedAt: currentTime,
  });
}

function toTimestampMs(val) {
  if (typeof val === 'number') return val;
  if (!val) return null;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val.seconds === 'number') return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

/**
 * Calculates remaining seconds based on expiresAt.
 *
 * @param {object} session
 * @param {number|(() => number)} [now=Date.now]
 * @returns {number}
 */
export function getExamSessionRemainingSeconds(session, now = Date.now) {
  if (!session) {
    return 0;
  }
  const expiresAtMs = toTimestampMs(session.expiresAt);
  if (!expiresAtMs) {
    return 0;
  }
  const currentTime = resolveTime(now);
  const diffMs = expiresAtMs - currentTime;
  const seconds = Math.max(0, Math.ceil(diffMs / 1000));
  return Number.isNaN(seconds) ? 0 : seconds;
}

/**
 * Checks if the exam session has expired.
 *
 * @param {object} session
 * @param {number|(() => number)} [now=Date.now]
 * @returns {boolean}
 */
export function isExamSessionExpired(session, now = Date.now) {
  if (!session || !session.expiresAt) {
    return false;
  }
  return getExamSessionRemainingSeconds(session, now) === 0;
}
