import { validateQuestion } from './questionValidation';
import { TOPICS } from './topics';

/**
 * Validates a complete variant payload (either an array of questions or an object with a questions array).
 *
 * @param {object|Array} payload - Parsed JSON variant data.
 * @returns {{
 *   isValid: boolean,
 *   errors: Array<string>,
 *   warnings: Array<string>,
 *   stats: {
 *     totalQuestions: number,
 *     totalPoints: number,
 *     singleChoiceCount: number,
 *     multiChoiceCount: number,
 *     topicCounts: Record<string, number>,
 *     difficultyCounts: Record<string, number>,
 *     coveredTopicsCount: number,
 *     isStandard40UNT: boolean
 *   },
 *   questions: Array<object>,
 *   meta: { variantId?: string, title?: string }
 * }}
 */
export function validateVariantPayload(payload) {
  const errors = [];
  const warnings = [];

  if (!payload || typeof payload !== 'object') {
    return {
      isValid: false,
      errors: [
        'Данные варианта должны быть валидным JSON-объектом или массивом.',
      ],
      warnings: [],
      stats: null,
      questions: [],
      meta: {},
    };
  }

  let questions = [];
  let meta = {};

  if (Array.isArray(payload)) {
    questions = payload;
  } else if (Array.isArray(payload.questions)) {
    questions = payload.questions;
    meta = {
      variantId: payload.variantId || '',
      title: payload.title || '',
    };
  } else {
    return {
      isValid: false,
      errors: [
        'Файл должен содержать массив заданий или объект со свойством "questions" (массив заданий).',
      ],
      warnings: [],
      stats: null,
      questions: [],
      meta: {},
    };
  }

  if (questions.length === 0) {
    return {
      isValid: false,
      errors: ['Вариант не содержит заданий (массив пуст).'],
      warnings: [],
      stats: null,
      questions: [],
      meta,
    };
  }

  // Pre-flight checks: ID deduplication
  const idSet = new Set();
  const duplicateIds = new Set();

  questions.forEach((q, index) => {
    if (!q || typeof q !== 'object') {
      errors.push(`Задание #${index + 1}: элемент не является объектом.`);
      return;
    }

    if (q.id) {
      if (idSet.has(q.id)) {
        duplicateIds.add(q.id);
      } else {
        idSet.add(q.id);
      }
    }

    const qErrors = validateQuestion(q);
    if (qErrors.length > 0) {
      qErrors.forEach((err) => {
        errors.push(`Задание #${index + 1} [${q.id || 'без ID'}]: ${err}`);
      });
    }

    // If payload has 40 questions, enforce UNT structure: 1..30 single, 31..40 multiple
    if (questions.length === 40 && Array.isArray(q.correctAnswers)) {
      if (index < 30 && q.correctAnswers.length > 1) {
        errors.push(
          `Задание #${index + 1} (Часть 1, 1–30): должно быть одиночным с 1 правильным ответом (получено: ${q.correctAnswers.length}).`
        );
      } else if (index >= 30 && q.correctAnswers.length < 2) {
        errors.push(
          `Задание #${index + 1} (Часть 2, 31–40): должно быть множественным с минимум 2 правильными ответами (получено: ${q.correctAnswers.length}).`
        );
      }
    }
  });

  if (duplicateIds.size > 0) {
    errors.push(
      `Обнаружены дублирующиеся ID заданий: ${Array.from(duplicateIds).join(', ')}`
    );
  }

  // Calculate stats
  let totalPoints = 0;
  let singleChoiceCount = 0;
  let multiChoiceCount = 0;
  const topicCounts = {};
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };

  TOPICS.forEach((t) => {
    topicCounts[t.id] = 0;
  });

  questions.forEach((q) => {
    if (!q || typeof q !== 'object') return;

    if (q.topic && topicCounts[q.topic] !== undefined) {
      topicCounts[q.topic] += 1;
    }

    if (q.difficulty && difficultyCounts[q.difficulty] !== undefined) {
      difficultyCounts[q.difficulty] += 1;
    }

    if (Array.isArray(q.correctAnswers)) {
      if (q.correctAnswers.length === 1) {
        singleChoiceCount += 1;
        totalPoints += 1;
      } else if (q.correctAnswers.length > 1) {
        multiChoiceCount += 1;
        totalPoints += 2;
      }
    }
  });

  const coveredTopicsCount = Object.values(topicCounts).filter(
    (count) => count > 0
  ).length;

  const isStandard40UNT =
    questions.length === 40 &&
    singleChoiceCount === 30 &&
    multiChoiceCount === 10 &&
    totalPoints === 50;

  if (questions.length !== 40) {
    warnings.push(
      `Стандартный вариант ЕНТ содержит 40 заданий (в текущем файле: ${questions.length}).`
    );
  }

  if (questions.length === 40 && totalPoints !== 50) {
    warnings.push(
      `Сумма баллов составляет ${totalPoints} из 50 стандартных для ЕНТ (30x1 + 10x2).`
    );
  }

  if (coveredTopicsCount < 12) {
    warnings.push(
      `Охвачено ${coveredTopicsCount} из 12 официальных тем ЕНТ по информатике.`
    );
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    stats: {
      totalQuestions: questions.length,
      totalPoints,
      singleChoiceCount,
      multiChoiceCount,
      topicCounts,
      difficultyCounts,
      coveredTopicsCount,
      isStandard40UNT,
    },
    questions,
    meta,
  };
}
