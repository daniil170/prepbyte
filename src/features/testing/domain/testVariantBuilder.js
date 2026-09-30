import {
  MULTI_CHOICE_QUESTION_COUNT,
  SINGLE_CHOICE_QUESTION_COUNT,
  TEST_QUESTION_COUNT,
} from './testConfig';

function shuffle(array, rng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

function selectRoundRobin(items, count, rng) {
  const topicMap = new Map();
  for (const item of items) {
    if (!item || !item.id) continue;
    const topic = item.topic || 'unknown';
    if (!topicMap.has(topic)) topicMap.set(topic, []);
    topicMap.get(topic).push(item);
  }

  const topicPools = new Map();
  for (const [topic, pool] of topicMap.entries()) {
    topicPools.set(topic, shuffle(pool, rng));
  }

  const topicKeys = Array.from(topicPools.keys()).sort();
  const selected = [];

  while (selected.length < count) {
    let addedInRound = false;
    for (const topic of topicKeys) {
      if (selected.length >= count) break;
      const pool = topicPools.get(topic);
      if (pool && pool.length > 0) {
        selected.push(pool.pop());
        addedInRound = true;
      }
    }
    if (!addedInRound) break;
  }

  return selected;
}

/**
 * Builds a balanced test variant conforming to the official UNT specification:
 * - Questions 1–30: Single-choice questions (1 point each).
 * - Questions 31–40: Multiple-choice questions (2 points each).
 * - Total: exactly 40 questions and exactly 50 max points.
 *
 * @param {Array<{ id: string, topic: string, correctAnswers?: number[] }>} questions - Available questions in bank.
 * @param {object} [options]
 * @param {number} [options.count=TEST_QUESTION_COUNT] - Number of questions to assemble.
 * @param {number} [options.singleChoiceCount=SINGLE_CHOICE_QUESTION_COUNT]
 * @param {number} [options.multiChoiceCount=MULTI_CHOICE_QUESTION_COUNT]
 * @param {() => number} [options.random=Math.random] - RNG function for determinism.
 * @returns {string[]} Array of question IDs in official UNT order.
 */
export function buildTestVariant(
  questions,
  {
    count = TEST_QUESTION_COUNT,
    singleChoiceCount = SINGLE_CHOICE_QUESTION_COUNT,
    multiChoiceCount = MULTI_CHOICE_QUESTION_COUNT,
    random = Math.random,
  } = {}
) {
  if (!Array.isArray(questions)) {
    throw new Error('Вопросы должны быть переданы массивом.');
  }

  if (questions.length < count) {
    throw new Error(
      `Недостаточно вопросов в банке: доступно ${questions.length}, требуется ${count}.`
    );
  }

  const singlePool = questions.filter(
    (q) => Array.isArray(q.correctAnswers) && q.correctAnswers.length === 1
  );
  const multiPool = questions.filter(
    (q) => Array.isArray(q.correctAnswers) && q.correctAnswers.length > 1
  );

  // If we have full typed pools to satisfy official UNT 30+10 structure:
  if (
    count === TEST_QUESTION_COUNT &&
    singlePool.length >= singleChoiceCount &&
    multiPool.length >= multiChoiceCount
  ) {
    const selectedSingle = selectRoundRobin(
      singlePool,
      singleChoiceCount,
      random
    );
    const selectedMulti = selectRoundRobin(multiPool, multiChoiceCount, random);

    // Shuffle within single section and multi section, but guarantee multi goes at the end (31-40)
    const shuffledSingle = shuffle(selectedSingle, random);
    const shuffledMulti = shuffle(selectedMulti, random);

    return [...shuffledSingle, ...shuffledMulti].map((q) => q.id);
  }

  // Graceful fallback for mock tests or custom counts without typed pools
  const selected = selectRoundRobin(questions, count, random);
  if (selected.length < count) {
    throw new Error(
      `Не удалось собрать необходимое количество вопросов (${count}). Доступно валидных вопросов: ${selected.length}.`
    );
  }

  // Final shuffle of selected questions
  const finalShuffled = shuffle(selected, random);
  return finalShuffled.map((q) => q.id);
}
