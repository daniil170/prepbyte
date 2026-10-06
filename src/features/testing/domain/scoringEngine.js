const LATIN_OPTION_MAP = {
  A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7,
};
const CYRILLIC_OPTION_MAP = {
  А: 0, В: 1, С: 2, Е: 4, К: 7,
  Б: 1, Г: 3, Д: 4, Ж: 6, И: 7,
};

/**
 * Normalizes answer indices from numbers, arrays, strings or letters.
 *
 * @param {number|number[]|string|string[]} raw
 * @returns {number[]} Array of 0-based sorted unique indices.
 */
export function normalizeAnswerIndices(raw) {
  if (raw === null || raw === undefined) return [];
  const items = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(/[,;\s+]+/).filter(Boolean)
      : [raw];

  const indices = [];
  for (const item of items) {
    if (typeof item === 'number' && Number.isInteger(item) && item >= 0) {
      indices.push(item);
    } else if (typeof item === 'string') {
      const trimmed = item.trim().toUpperCase();
      if (/^\d+$/.test(trimmed)) {
        indices.push(parseInt(trimmed, 10));
      } else if (LATIN_OPTION_MAP[trimmed] !== undefined) {
        indices.push(LATIN_OPTION_MAP[trimmed]);
      } else if (CYRILLIC_OPTION_MAP[trimmed] !== undefined) {
        indices.push(CYRILLIC_OPTION_MAP[trimmed]);
      }
    }
  }

  return [...new Set(indices)].sort((a, b) => a - b);
}

/**
 * Evaluates a single question against user answers using official UNT (ЕНТ) grading rules.
 *
 * Single-choice questions (correctAnswers.length === 1):
 * - 1 point if the single selected option matches correctAnswers[0].
 * - 0 points otherwise.
 *
 * Multiple-choice questions (correctAnswers.length > 1 or multiple flag):
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

  const validUserIndices = normalizeAnswerIndices(userAnswers);
  const userSet = new Set(validUserIndices);

  const rawCorrect =
    question.correctAnswers !== undefined
      ? question.correctAnswers
      : question.correctAnswer !== undefined
        ? question.correctAnswer
        : question.correct_answers !== undefined
          ? question.correct_answers
          : [];
  const validCorrectIndices = normalizeAnswerIndices(rawCorrect);
  const correctSet = new Set(validCorrectIndices);

  const isMultipleChoice = Boolean(
    question.type === 'multiple' ||
      question.multiple === true ||
      correctSet.size > 1 ||
      (typeof question.number === 'number' && question.number >= 31 && question.number <= 40)
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

  if (userSet.size === 0 || correctSet.size === 0) {
    pointsAwarded = 0;
  } else if (!isMultipleChoice) {
    const singleCorrect = validCorrectIndices[0];
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
