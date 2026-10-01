import { validateQuestion } from './questionValidation';
import {
  calculateJaccardSimilarity,
  extractWordShingles,
  normalizeQuestionText,
} from './questionSimilarity';

/**
 * Builds imported question entities from raw parsed document blocks, performs
 * domain validation, and detects exact and near duplicates against the existing bank
 * and within the current file.
 *
 * @param {Array<object>} parsedItems - Items returned from parseQuestionBlocks.
 * @param {object} options
 * @param {string} [options.variantSlug='imported-var'] - Slug for generating question IDs.
 * @param {string} [options.defaultTopic=''] - Default topic assigned if none specified.
 * @param {string} [options.defaultDifficulty='medium'] - Default difficulty level.
 * @param {Array<object>} [options.existingQuestions=[]] - Existing question bank for duplicate detection.
 * @returns {Array<{
 *   question: object,
 *   status: 'ok' | 'warning' | 'error',
 *   issues: string[],
 *   duplicateOf: string | null
 * }>}
 */
export function buildImportedQuestions(
  parsedItems = [],
  {
    variantSlug = 'imported-var',
    defaultTopic = '',
    defaultDifficulty = 'medium',
    existingQuestions = [],
  } = {}
) {
  if (!Array.isArray(parsedItems)) {
    return [];
  }

  const cleanSlug = (variantSlug || 'imported-var')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');

  // Pre-index existing questions for duplicate checks
  const existingMap = (existingQuestions || []).map((q) => ({
    id: q.id,
    normalizedText: normalizeQuestionText(q.questionText),
    shingles: extractWordShingles(q.questionText),
  }));

  const results = [];
  const processedInFile = [];

  for (let idx = 0; idx < parsedItems.length; idx++) {
    const item = parsedItems[idx];
    const qNum = item.number || idx + 1;
    const paddedNum = String(qNum).padStart(3, '0');
    const questionId = `${cleanSlug}-${paddedNum}`;

    const rawQuestion = {
      id: questionId,
      topic: item.topic || defaultTopic || '',
      questionText: item.questionText || '',
      options: item.options || [],
      correctAnswers: item.correctAnswers || [],
      explanation: item.explanation || '',
      difficulty: item.difficulty || defaultDifficulty || 'medium',
      version: 1,
    };

    const issues = [...(item.issues || [])];
    let status = item.status === 'error' ? 'error' : 'ok';
    let duplicateOf = null;

    // Check explanation presence
    if (!rawQuestion.explanation || !rawQuestion.explanation.trim()) {
      if (!issues.includes('needs-explanation')) {
        issues.push('needs-explanation');
      }
      status = 'error';
    }

    // Run domain validator
    const validationErrors = validateQuestion(rawQuestion);
    for (const vErr of validationErrors) {
      if (!issues.includes(vErr)) {
        // If it's about explanation, we already tagged needs-explanation
        if (vErr.includes('explanation')) {
          if (!issues.includes('needs-explanation')) {
            issues.push('needs-explanation');
          }
        } else {
          issues.push(vErr);
        }
      }
      status = 'error';
    }

    // Check duplicates if question text is present
    if (rawQuestion.questionText && rawQuestion.questionText.trim()) {
      const currentNorm = normalizeQuestionText(rawQuestion.questionText);
      const currentShingles = extractWordShingles(rawQuestion.questionText);

      // 1. Check against existing bank: exact duplicate
      const exactExisting = existingMap.find(
        (e) => e.normalizedText === currentNorm
      );
      if (exactExisting) {
        duplicateOf = exactExisting.id;
        status = 'error';
        issues.push(`Точный дубликат вопроса из базы (${exactExisting.id})`);
      } else {
        // 2. Check against already processed questions in this file: exact duplicate
        const exactInFile = processedInFile.find(
          (p) => p.normalizedText === currentNorm
        );
        if (exactInFile) {
          duplicateOf = exactInFile.id;
          status = 'error';
          issues.push(
            `Точный дубликат вопроса #${exactInFile.number} в этом файле`
          );
        } else {
          // 3. Check near duplicates against existing bank (threshold >= 0.8)
          let bestNear = null;
          let bestScore = 0;

          for (const ext of existingMap) {
            const sim = calculateJaccardSimilarity(
              currentShingles,
              ext.shingles
            );
            if (sim >= 0.8 && sim > bestScore) {
              bestScore = sim;
              bestNear = ext;
            }
          }

          if (bestNear) {
            duplicateOf = bestNear.id;
            if (status !== 'error') {
              status = 'warning';
            }
            issues.push(
              `Похож на вопрос ${bestNear.id} (${Math.round(bestScore * 100)}% схожести)`
            );
          } else {
            // 4. Check near duplicates within file
            for (const inf of processedInFile) {
              const sim = calculateJaccardSimilarity(
                currentShingles,
                inf.shingles
              );
              if (sim >= 0.8 && sim > bestScore) {
                bestScore = sim;
                bestNear = inf;
              }
            }
            if (bestNear) {
              duplicateOf = bestNear.id;
              if (status !== 'error') {
                status = 'warning';
              }
              issues.push(
                `Похож на вопрос #${bestNear.number} в этом файле (${Math.round(bestScore * 100)}% схожести)`
              );
            }
          }
        }
      }

      processedInFile.push({
        id: questionId,
        number: qNum,
        normalizedText: currentNorm,
        shingles: currentShingles,
      });
    }

    results.push({
      question: rawQuestion,
      status,
      issues,
      duplicateOf,
    });
  }

  return results;
}
