import {
  MULTI_CHOICE_QUESTION_COUNT,
  SINGLE_CHOICE_QUESTION_COUNT,
} from './testConfig';

function shuffle(array, rng = Math.random) {
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
 * Selects questions from a single pool (single-choice or multiple-choice)
 * using the four-phase novelty and topic balancing algorithm.
 *
 * Phases:
 * (a) never-seen questions only, with per-topic cap of ceil(quota / topicsInPool) + 1,
 *     round-robin across shuffled topics;
 * (b) never-seen questions with the cap relaxed;
 * (c) seen questions ordered by timesSeen asc, then lastSeenAt asc, with the cap;
 * (d) seen questions with the cap relaxed.
 *
 * Ties are broken by the injected random function.
 *
 * @param {Array<object>} pool
 * @param {number} quota
 * @param {Record<string, { timesSeen: number, lastSeenAt: number }>} exposure
 * @param {() => number} random
 * @returns {Array<object>}
 */
function selectFromPool(pool, quota, exposure, random) {
  if (quota <= 0 || !Array.isArray(pool) || pool.length === 0) {
    return [];
  }

  if (pool.length <= quota) {
    return shuffle(pool, random);
  }

  const distinctTopics = Array.from(
    new Set(pool.map((q) => q.topic || 'unknown'))
  );
  const topicsInPool = Math.max(1, distinctTopics.length);
  const topicCap = Math.ceil(quota / topicsInPool) + 1;

  // Partition pool into unseen (timesSeen === 0) and seen (timesSeen > 0)
  const unseenQuestions = [];
  const seenQuestions = [];

  for (const q of pool) {
    const timesSeen = exposure?.[q.id]?.timesSeen || 0;
    if (timesSeen === 0) {
      unseenQuestions.push(q);
    } else {
      seenQuestions.push(q);
    }
  }

  const selected = [];
  const selectedIds = new Set();
  const topicCounts = {};

  // Group unseen questions by topic
  const unseenByTopic = new Map();
  for (const topic of distinctTopics) {
    unseenByTopic.set(topic, []);
  }
  for (const q of unseenQuestions) {
    const topic = q.topic || 'unknown';
    if (!unseenByTopic.has(topic)) {
      unseenByTopic.set(topic, []);
    }
    unseenByTopic.get(topic).push(q);
  }

  // Shuffle questions within each topic
  for (const [topic, items] of unseenByTopic.entries()) {
    unseenByTopic.set(topic, shuffle(items, random));
  }

  const shuffledTopics = shuffle([...distinctTopics], random);

  // Phase (a): never-seen questions with per-topic cap, round-robin across shuffled topics
  while (selected.length < quota) {
    let addedInRound = false;
    for (const topic of shuffledTopics) {
      if (selected.length >= quota) break;
      const currentTopicCount = topicCounts[topic] || 0;
      if (currentTopicCount >= topicCap) {
        continue;
      }
      const list = unseenByTopic.get(topic);
      if (list && list.length > 0) {
        const item = list.pop();
        selected.push(item);
        selectedIds.add(item.id);
        topicCounts[topic] = currentTopicCount + 1;
        addedInRound = true;
      }
    }
    if (!addedInRound) {
      break;
    }
  }

  // Phase (b): never-seen questions with the topic cap relaxed
  if (selected.length < quota) {
    const remainingUnseen = [];
    for (const topic of shuffledTopics) {
      const list = unseenByTopic.get(topic);
      if (list && list.length > 0) {
        remainingUnseen.push(...list);
      }
    }

    const shuffledRemainingUnseen = shuffle(remainingUnseen, random);
    for (const item of shuffledRemainingUnseen) {
      if (selected.length >= quota) break;
      selected.push(item);
      selectedIds.add(item.id);
      topicCounts[item.topic] = (topicCounts[item.topic] || 0) + 1;
    }
  }

  // If quota is satisfied by unseen questions, return shuffled selection
  if (selected.length >= quota) {
    return shuffle(selected, random);
  }

  // Prepare seen questions ordered by timesSeen asc, then lastSeenAt asc, tie-broken by random()
  const seenCandidates = seenQuestions
    .filter((q) => !selectedIds.has(q.id))
    .map((q) => ({
      item: q,
      timesSeen: exposure?.[q.id]?.timesSeen || 0,
      lastSeenAt: exposure?.[q.id]?.lastSeenAt || 0,
      rand: random(),
    }));

  seenCandidates.sort((a, b) => {
    if (a.timesSeen !== b.timesSeen) {
      return a.timesSeen - b.timesSeen;
    }
    if (a.lastSeenAt !== b.lastSeenAt) {
      return a.lastSeenAt - b.lastSeenAt;
    }
    return a.rand - b.rand;
  });

  const remainingSeenAfterCap = [];

  // Phase (c): seen questions with per-topic cap
  for (const candidate of seenCandidates) {
    if (selected.length >= quota) break;
    const item = candidate.item;
    const currentTopicCount = topicCounts[item.topic] || 0;
    if (currentTopicCount < topicCap) {
      selected.push(item);
      selectedIds.add(item.id);
      topicCounts[item.topic] = currentTopicCount + 1;
    } else {
      remainingSeenAfterCap.push(item);
    }
  }

  // Phase (d): seen questions with the cap relaxed
  if (selected.length < quota) {
    for (const item of remainingSeenAfterCap) {
      if (selected.length >= quota) break;
      if (!selectedIds.has(item.id)) {
        selected.push(item);
        selectedIds.add(item.id);
        topicCounts[item.topic] = (topicCounts[item.topic] || 0) + 1;
      }
    }
  }

  return shuffle(selected, random);
}

/**
 * Builds a novelty-aware, topic-balanced test variant.
 *
 * @param {Array<object>} questions - Available questions in bank ({ id, topic, multiple?, correctAnswers? }).
 * @param {object} [options]
 * @param {number} [options.count] - Total question quota (defaults to structure sum or 40).
 * @param {{ single?: number, multiple?: number }} [options.structure] - Target type distribution.
 * @param {number} [options.singleChoiceCount] - Legacy parameter for single question count.
 * @param {number} [options.multiChoiceCount] - Legacy parameter for multiple question count.
 * @param {Record<string, { timesSeen: number, lastSeenAt: number }>} [options.exposure={}] - Exposure tracking dict.
 * @param {() => number} [options.random=Math.random] - RNG function for determinism.
 * @returns {{ questionIds: string[], newQuestionCount: number }} Built variant question IDs and novelty count.
 */
export function buildTestVariant(
  questions,
  {
    count,
    structure,
    singleChoiceCount,
    multiChoiceCount,
    exposure = {},
    random = Math.random,
  } = {}
) {
  if (!Array.isArray(questions)) {
    throw new Error('Вопросы должны быть переданы массивом.');
  }

  const targetSingle =
    structure?.single ?? singleChoiceCount ?? SINGLE_CHOICE_QUESTION_COUNT;
  const targetMultiple =
    structure?.multiple ?? multiChoiceCount ?? MULTI_CHOICE_QUESTION_COUNT;
  const totalCount = count ?? targetSingle + targetMultiple;

  if (questions.length < totalCount) {
    throw new Error(
      `Недостаточно вопросов в банке: доступно ${questions.length}, требуется ${totalCount}.`
    );
  }

  const isMultiQuestion = (q) =>
    Boolean(
      q.type === 'multiple' ||
      q.multiple ||
      (Array.isArray(q.correctAnswers) && q.correctAnswers.length > 1)
    );

  const singlePool = questions.filter((q) => !isMultiQuestion(q));
  const multiPool = questions.filter((q) => isMultiQuestion(q));

  // Determine quotas per pool, borrowing from the other pool when one is short
  let quotaSingle = targetSingle;
  let quotaMultiple = targetMultiple;

  if (singlePool.length < quotaSingle) {
    quotaSingle = singlePool.length;
    quotaMultiple = totalCount - quotaSingle;
  } else if (multiPool.length < quotaMultiple) {
    quotaMultiple = multiPool.length;
    quotaSingle = totalCount - quotaMultiple;
  }

  // If pools cannot satisfy typed distribution at all, fall back to general pool
  if (quotaSingle <= 0 && quotaMultiple <= 0) {
    const selected = selectFromPool(questions, totalCount, exposure, random);
    const newQuestionCount = selected.filter(
      (q) => (exposure?.[q.id]?.timesSeen || 0) === 0
    ).length;
    return {
      questionIds: selected.map((q) => q.id),
      newQuestionCount,
    };
  }

  const selectedSingle = selectFromPool(
    singlePool,
    quotaSingle,
    exposure,
    random
  );
  const selectedMulti = selectFromPool(
    multiPool,
    quotaMultiple,
    exposure,
    random
  );

  // Guarantee single questions in Part 1 (1–30) and multi questions in Part 2 (31–40)
  const finalOrdered = [...selectedSingle, ...selectedMulti];
  const newQuestionCount = finalOrdered.filter(
    (q) => (exposure?.[q.id]?.timesSeen || 0) === 0
  ).length;

  return {
    questionIds: finalOrdered.map((q) => q.id),
    newQuestionCount,
  };
}
