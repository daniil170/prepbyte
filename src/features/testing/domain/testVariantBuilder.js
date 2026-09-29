import { TEST_QUESTION_COUNT } from './testConfig';

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

/**
 * Builds a balanced test variant of question IDs by distributing evenly
 * across topics via round-robin, then shuffling the final order.
 *
 * @param {Array<{ id: string, topic: string }>} questions - Available questions in bank.
 * @param {object} [options]
 * @param {number} [options.count=TEST_QUESTION_COUNT] - Number of questions to assemble.
 * @param {() => number} [options.random=Math.random] - RNG function for determinism.
 * @returns {string[]} Array of question IDs.
 */
export function buildTestVariant(
  questions,
  { count = TEST_QUESTION_COUNT, random = Math.random } = {}
) {
  if (!Array.isArray(questions)) {
    throw new Error('Вопросы должны быть переданы массивом.');
  }

  if (questions.length < count) {
    throw new Error(
      `Недостаточно вопросов в банке: доступно ${questions.length}, требуется ${count}.`
    );
  }

  // Group questions by topic
  const topicMap = new Map();
  for (const question of questions) {
    if (!question || !question.id) {
      continue;
    }
    const topic = question.topic || 'unknown';
    if (!topicMap.has(topic)) {
      topicMap.set(topic, []);
    }
    topicMap.get(topic).push(question);
  }

  // Shuffle questions within each topic pool
  const topicPools = new Map();
  for (const [topic, pool] of topicMap.entries()) {
    topicPools.set(topic, shuffle(pool, random));
  }

  // Stable sorted topic list for round-robin order
  const topicKeys = Array.from(topicPools.keys()).sort();
  const selected = [];

  while (selected.length < count) {
    let addedInRound = false;

    for (const topic of topicKeys) {
      if (selected.length >= count) {
        break;
      }
      const pool = topicPools.get(topic);
      if (pool && pool.length > 0) {
        selected.push(pool.pop());
        addedInRound = true;
      }
    }

    if (!addedInRound) {
      break;
    }
  }

  if (selected.length < count) {
    throw new Error(
      `Не удалось собрать необходимое количество вопросов (${count}). Доступно валидных вопросов: ${selected.length}.`
    );
  }

  // Final shuffle of selected questions
  const finalShuffled = shuffle(selected, random);
  return finalShuffled.map((q) => q.id);
}
