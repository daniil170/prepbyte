export const EXAM_SESSION_STATUS = Object.freeze({
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  ABANDONED: 'abandoned',
});

function resolveTime(now) {
  if (typeof now === 'function') {
    return now();
  }
  return typeof now === 'number' ? now : Date.now();
}

/**
 * Pure evaluation function for exam answers against question bank items.
 *
 * @param {Record<string, number[]>} answers
 * @param {Array<object>} questions
 * @returns {object}
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
 * Creates a new student exam session.
 *
 * @param {object} params
 * @param {string} params.id
 * @param {string} params.examId
 * @param {string} params.studentId
 * @param {string} [params.studentName='']
 * @param {string} params.groupId
 * @param {number} [params.durationSeconds=3600]
 * @param {string} [params.status='waiting']
 * @param {number|(() => number)} [params.now=Date.now]
 * @returns {object} Immutable ExamSession.
 */
export function createExamSession({
  id,
  examId,
  studentId,
  studentName = '',
  groupId,
  durationSeconds = 3600,
  status = EXAM_SESSION_STATUS.WAITING,
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

  return Object.freeze({
    id,
    examId,
    studentId,
    studentName: (studentName || '').trim(),
    groupId: (groupId || '').trim(),
    status,
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

/**
 * Calculates remaining seconds based on expiresAt.
 *
 * @param {object} session
 * @param {number|(() => number)} [now=Date.now]
 * @returns {number}
 */
export function getExamSessionRemainingSeconds(session, now = Date.now) {
  if (!session || !session.expiresAt) {
    return 0;
  }
  const currentTime = resolveTime(now);
  const diffMs = session.expiresAt - currentTime;
  return Math.max(0, Math.ceil(diffMs / 1000));
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
