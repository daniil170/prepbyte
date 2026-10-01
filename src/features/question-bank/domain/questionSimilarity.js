/**
 * Pure domain logic for question text normalization, exact/near duplicate detection,
 * and comprehensive bank coverage & disjoint variant capacity auditing.
 */

/**
 * Normalizes question text by trimming, lowercasing, collapsing consecutive
 * whitespace to a single space, and stripping markdown code fence markers.
 *
 * @param {string} text - Raw question text.
 * @returns {string} Normalized text string.
 */
export function normalizeQuestionText(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/```[a-zA-Z0-9_-]*/g, '')
    .replace(/`/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts word 3-shingles from text. If fewer than 3 words, falls back to the full phrase.
 *
 * @param {string} text
 * @returns {Set<string>}
 */
export function extractWordShingles(text, shingleSize = 3) {
  const normalized = normalizeQuestionText(text);
  if (!normalized) {
    return new Set();
  }

  const words = normalized.split(' ').filter(Boolean);
  if (words.length < shingleSize) {
    return words.length > 0 ? new Set([words.join(' ')]) : new Set();
  }

  const shingles = new Set();
  for (let i = 0; i <= words.length - shingleSize; i++) {
    shingles.add(words.slice(i, i + shingleSize).join(' '));
  }
  return shingles;
}

/**
 * Computes Jaccard similarity between two sets of shingles.
 *
 * @param {Set<string>} setA
 * @param {Set<string>} setB
 * @returns {number} Score between 0.0 and 1.0.
 */
export function calculateJaccardSimilarity(setA, setB) {
  if (!setA || !setB || setA.size === 0 || setB.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
}

/**
 * Finds exact duplicates in the questions array based on normalized text.
 *
 * @param {Array<{ id: string, questionText: string }>} questions
 * @returns {Array<{ normalizedText: string, ids: string[] }>} Groups of duplicate question IDs.
 */
export function findExactDuplicates(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  const textToIds = new Map();

  for (const q of questions) {
    if (!q || !q.id) continue;
    const normalized = normalizeQuestionText(q.questionText || '');
    if (!normalized) continue;

    if (!textToIds.has(normalized)) {
      textToIds.set(normalized, []);
    }
    textToIds.get(normalized).push(q.id);
  }

  const duplicateGroups = [];
  for (const [normalizedText, ids] of textToIds.entries()) {
    if (ids.length > 1) {
      duplicateGroups.push({
        normalizedText,
        ids: [...ids],
      });
    }
  }

  return duplicateGroups;
}

/**
 * Finds near-duplicate pairs of questions using Jaccard similarity over word 3-shingles.
 *
 * @param {Array<{ id: string, questionText: string }>} questions
 * @param {object} [options]
 * @param {number} [options.threshold=0.8] - Minimum Jaccard similarity to include.
 * @returns {Array<{ q1: string, q2: string, score: number, text1: string, text2: string }>}
 *   Sorted descending by score.
 */
export function findNearDuplicates(questions, { threshold = 0.8 } = {}) {
  if (!Array.isArray(questions) || questions.length < 2) {
    return [];
  }

  const validQuestions = questions.filter((q) => q && q.id);
  const shingleCache = new Map();

  for (const q of validQuestions) {
    shingleCache.set(q.id, extractWordShingles(q.questionText || ''));
  }

  const pairs = [];

  for (let i = 0; i < validQuestions.length; i++) {
    const q1 = validQuestions[i];
    const shingles1 = shingleCache.get(q1.id);
    if (!shingles1 || shingles1.size === 0) continue;

    for (let j = i + 1; j < validQuestions.length; j++) {
      const q2 = validQuestions[j];
      const shingles2 = shingleCache.get(q2.id);
      if (!shingles2 || shingles2.size === 0) continue;

      const score = calculateJaccardSimilarity(shingles1, shingles2);
      if (score >= threshold) {
        pairs.push({
          q1: q1.id,
          q2: q2.id,
          score: Math.round(score * 1000) / 1000,
          text1: q1.questionText || '',
          text2: q2.questionText || '',
        });
      }
    }
  }

  pairs.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.q1 !== b.q1) {
      return a.q1.localeCompare(b.q1);
    }
    return a.q2.localeCompare(b.q2);
  });

  return pairs;
}

/**
 * Performs a comprehensive health, diversity and capacity audit on a question bank.
 *
 * @param {Array<{ id: string, topic: string, difficulty?: string, correctAnswers?: number[], questionText: string }>} questions
 * @param {object} [options]
 * @param {number} [options.single=30] - Single-choice questions needed per variant.
 * @param {number} [options.multiple=10] - Multiple-choice questions needed per variant.
 * @param {number} [options.similarityThreshold=0.8]
 * @returns {object} Audit report entity.
 */
export function auditBank(
  questions,
  { single = 30, multiple = 10, similarityThreshold = 0.8 } = {}
) {
  const safeList = Array.isArray(questions) ? questions.filter(Boolean) : [];

  const perTopic = {};
  const perType = { single: 0, multiple: 0 };
  const perDifficulty = { easy: 0, medium: 0, hard: 0 };

  for (const q of safeList) {
    const topic = q.topic || 'unknown';
    perTopic[topic] = (perTopic[topic] || 0) + 1;

    const isMultiple =
      Array.isArray(q.correctAnswers) && q.correctAnswers.length > 1;
    if (isMultiple) {
      perType.multiple++;
    } else {
      perType.single++;
    }

    const diff = (q.difficulty || 'medium').toLowerCase();
    if (diff in perDifficulty) {
      perDifficulty[diff]++;
    } else {
      perDifficulty[diff] = (perDifficulty[diff] || 0) + 1;
    }
  }

  const singleVariants = Math.floor(perType.single / single);
  const multipleVariants = Math.floor(perType.multiple / multiple);
  const supportedDisjointVariants = Math.min(singleVariants, multipleVariants);

  let limitingType = 'equal';
  if (singleVariants < multipleVariants) {
    limitingType = 'single';
  } else if (multipleVariants < singleVariants) {
    limitingType = 'multiple';
  }

  const calcMissing = (target) => ({
    targetVariants: target,
    requiredSingle: target * single,
    requiredMultiple: target * multiple,
    missingSingle: Math.max(0, target * single - perType.single),
    missingMultiple: Math.max(0, target * multiple - perType.multiple),
    missingTotal:
      Math.max(0, target * single - perType.single) +
      Math.max(0, target * multiple - perType.multiple),
  });

  const missingFor5 = calcMissing(5);
  const missingFor10 = calcMissing(10);

  const exactDuplicates = findExactDuplicates(safeList);
  const nearDuplicates = findNearDuplicates(safeList, {
    threshold: similarityThreshold,
  });

  return {
    totalCount: safeList.length,
    perTopic,
    perType,
    perDifficulty,
    exactDuplicates,
    nearDuplicates,
    supportedDisjointVariants,
    limitingType,
    targets: {
      5: missingFor5,
      10: missingFor10,
    },
    missingFor5,
    missingFor10,
  };
}
