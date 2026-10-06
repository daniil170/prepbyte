/**
 * Evaluates a single question against user answers using official UNT (ЕНТ) grading rules.
 *
 * Single-choice questions (correctAnswers.length === 1):
 * - 1 point if the single selected option matches correctAnswers[0].
 * - 0 points otherwise.
 *
 * Multiple-choice questions (correctAnswers.length > 1):
 * - 2 points: all correct options chosen with zero mistakes (0 omissions, 0 false positives).
 * - 1 point: exactly one omission OR one false positive (standard UNT partial credit).
 * - 0 points: two or more errors.
 *
 * @param {object} params
 * @param {object} params.question - Question entity or snapshot.
 * @param {number[]} [params.userAnswers=[]] - Selected option indices.
 * @returns {object} Detailed evaluation for the question.
 */
export function evaluateQuestion({ question, userAnswers = [] }) {
  if (!question || typeof question !== 'object') {
    throw new Error('Вопрос обязателен для проверки.');
  }

  const rawUserAnswers = Array.isArray(userAnswers) ? userAnswers : [];
  const validUserIndices = rawUserAnswers.filter(
    (idx) => typeof idx === 'number' && Number.isInteger(idx) && idx >= 0
  );
  const userSet = new Set(validUserIndices);

  const rawCorrectAnswers = Array.isArray(question.correctAnswers)
    ? question.correctAnswers
    : [];
  const validCorrectIndices = rawCorrectAnswers.filter(
    (idx) => typeof idx === 'number' && Number.isInteger(idx) && idx >= 0
  );
  const correctSet = new Set(validCorrectIndices);

  const isMultipleChoice = Boolean(
    question.type === 'multiple' ||
      question.multiple === true ||
      correctSet.size > 1
  );
  const maxPoints =
    typeof question.maxPoints === 'number'
      ? question.maxPoints
      : typeof question.points === 'number'
        ? question.points
        : isMultipleChoice
          ? 2
          : 1;

  let pointsAwarded = 0;

  if (!isMultipleChoice) {
    const singleCorrect = rawCorrectAnswers[0];
    if (userSet.size === 1 && userSet.has(singleCorrect)) {
      pointsAwarded = maxPoints;
    } else {
      pointsAwarded = 0;
    }
  } else {
    let omissions = 0;
    for (const ans of correctSet) {
      if (!userSet.has(ans)) {
        omissions++;
      }
    }

    let falsePositives = 0;
    for (const ans of userSet) {
      if (!correctSet.has(ans)) {
        falsePositives++;
      }
    }

    const totalErrors = omissions + falsePositives;

    if (totalErrors === 0) {
      pointsAwarded = 2;
    } else if (totalErrors === 1) {
      pointsAwarded = 1;
    } else {
      pointsAwarded = 0;
    }
  }

  const isCorrect = pointsAwarded === maxPoints;
  const isPartiallyCorrect = pointsAwarded > 0 && pointsAwarded < maxPoints;

  return {
    id: question.id,
    topic: question.topic || 'unknown',
    questionText: question.questionText || '',
    options: Array.isArray(question.options) ? [...question.options] : [],
    userAnswers: Array.from(userSet).sort((a, b) => a - b),
    correctAnswers: Array.from(correctSet).sort((a, b) => a - b),
    explanation: question.explanation || '',
    difficulty: question.difficulty || 'medium',
    isMultipleChoice,
    pointsAwarded,
    maxPoints,
    isCorrect,
    isPartiallyCorrect,
  };
}

/**
 * Calculates exam-wide score, topic breakdown, and question snapshots.
 *
 * @param {object} session - Test session object containing user answers.
 * @param {Array<object>} questions - Questions in the exam variant.
 * @returns {{
 *   totalScore: number,
 *   maxPossibleScore: number,
 *   percentage: number,
 *   passed: boolean,
 *   byTopicBreakdown: Record<string, {
 *     topic: string,
 *     score: number,
 *     maxScore: number,
 *     percentage: number,
 *     totalQuestions: number,
 *     correctCount: number,
 *     partialCount: number,
 *     incorrectCount: number
 *   }>,
 *   detailedResults: Array<object>
 * }}
 */
export function calculateExamScore(session, questions) {
  if (!Array.isArray(questions)) {
    throw new Error('Список вопросов должен быть массивом.');
  }

  const answersMap =
    session && session.answers && typeof session.answers === 'object'
      ? session.answers
      : {};

  let totalScore = 0;
  let maxPossibleScore = 0;
  const byTopicBreakdown = {};
  const detailedResults = [];

  for (const question of questions) {
    if (!question || !question.id) {
      continue;
    }

    const userAnswers = answersMap[question.id] || [];
    const result = evaluateQuestion({ question, userAnswers });

    detailedResults.push(result);
    totalScore += result.pointsAwarded;
    maxPossibleScore += result.maxPoints;

    const topic = result.topic;
    if (!byTopicBreakdown[topic]) {
      byTopicBreakdown[topic] = {
        topic,
        score: 0,
        maxScore: 0,
        percentage: 0,
        totalQuestions: 0,
        correctCount: 0,
        partialCount: 0,
        incorrectCount: 0,
      };
    }

    const topicEntry = byTopicBreakdown[topic];
    topicEntry.score += result.pointsAwarded;
    topicEntry.maxScore += result.maxPoints;
    topicEntry.totalQuestions += 1;

    if (result.isCorrect) {
      topicEntry.correctCount += 1;
    } else if (result.isPartiallyCorrect) {
      topicEntry.partialCount += 1;
    } else {
      topicEntry.incorrectCount += 1;
    }
  }

  for (const topic of Object.keys(byTopicBreakdown)) {
    const entry = byTopicBreakdown[topic];
    entry.percentage =
      entry.maxScore > 0 ? Math.round((entry.score / entry.maxScore) * 100) : 0;
  }

  const percentage =
    maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 100)
      : 0;

  // Passing threshold: 50% (25 points out of 50 in standard UNT)
  const passed = percentage >= 50;

  return {
    totalScore,
    maxPossibleScore,
    percentage,
    passed,
    byTopicBreakdown,
    detailedResults,
  };
}
