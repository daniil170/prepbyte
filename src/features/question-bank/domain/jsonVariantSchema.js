import { isValidTopic } from './topics.js';

/**
 * Expected schema format for canonical UNT mock exams:
 * {
 *   variantId: "unt-var-YYYY-MM-DD-NN",
 *   title: "ЕНТ Информатика — Вариант №N",
 *   createdAt: "ISO-8601 date",
 *   questions: [ ...40 questions ]
 * }
 */
export const VARIANT_ID_REGEX = /^unt-var-\d{4}-\d{2}-\d{2}-\d{2,}$/;
export const ISO_8601_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
export const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

/**
 * Validates a single question against canonical JSON UNT specifications.
 *
 * @param {any} q - The question object to validate.
 * @param {number} index - 0-based index of the question in the variant.
 * @returns {string[]} Array of error strings for this question.
 */
export function validateCanonicalQuestion(q, index) {
  const errors = [];
  const qNum = index + 1;
  const prefix = `Задание #${qNum}`;

  if (!q || typeof q !== 'object' || Array.isArray(q)) {
    return [`${prefix}: элемент должен быть объектом.`];
  }

  // number field
  if (q.number !== undefined && q.number !== qNum) {
    errors.push(`${prefix}: свойство number (${q.number}) должно соответствовать порядковому номеру ${qNum}.`);
  }

  // questionText field
  if (typeof q.questionText !== 'string' || !q.questionText.trim()) {
    errors.push(`${prefix}: поле questionText обязательно и не должно быть пустым.`);
  }

  // options field
  if (!Array.isArray(q.options)) {
    errors.push(`${prefix}: поле options должно быть массивом строк.`);
  } else {
    const isPart1 = qNum <= 30;
    const isPart2 = qNum >= 31 && qNum <= 40;

    if (isPart1 && q.options.length !== 4) {
      errors.push(`${prefix} (Часть 1): должно быть ровно 4 варианта ответа (получено: ${q.options.length}).`);
    } else if (isPart2 && (q.options.length < 4 || q.options.length > 6)) {
      errors.push(`${prefix} (Часть 2): должно содержать от 4 до 6 вариантов ответа (получено: ${q.options.length}).`);
    }

    const hasEmptyOption = q.options.some((opt) => typeof opt !== 'string' || !opt.trim());
    if (hasEmptyOption) {
      errors.push(`${prefix}: все варианты ответа в options должны быть непустыми строками.`);
    }

    const trimmedOptions = q.options.map((opt) => (typeof opt === 'string' ? opt.trim() : opt));
    const uniqueOptions = new Set(trimmedOptions);
    if (uniqueOptions.size !== q.options.length) {
      errors.push(`${prefix}: варианты ответа в options не должны дублироваться.`);
    }
  }

  // correctAnswers field
  if (!Array.isArray(q.correctAnswers)) {
    errors.push(`${prefix}: поле correctAnswers должно быть массивом числовых индексов.`);
  } else {
    const isPart1 = qNum <= 30;
    const isPart2 = qNum >= 31 && qNum <= 40;

    if (isPart1 && q.correctAnswers.length !== 1) {
      errors.push(`${prefix} (Часть 1): должно быть ровно 1 правильный ответ (получено: ${q.correctAnswers.length}).`);
    } else if (isPart2 && (q.correctAnswers.length < 2 || q.correctAnswers.length > 3)) {
      errors.push(`${prefix} (Часть 2): должно содержать 2 или 3 правильных ответа (получено: ${q.correctAnswers.length}).`);
    }

    const uniqueAnswers = new Set(q.correctAnswers);
    if (uniqueAnswers.size !== q.correctAnswers.length) {
      errors.push(`${prefix}: массив correctAnswers не должен содержать дубликатов.`);
    }

    const maxValidIndex = Array.isArray(q.options) ? q.options.length - 1 : -1;
    for (const ansIdx of q.correctAnswers) {
      if (typeof ansIdx !== 'number' || !Number.isInteger(ansIdx) || ansIdx < 0 || ansIdx > maxValidIndex) {
        errors.push(`${prefix}: индекс ${ansIdx} в correctAnswers выходит за пределы допустимого диапазона вариантов (0..${maxValidIndex}).`);
      }
    }
  }

  // topic field
  if (typeof q.topic !== 'string' || !isValidTopic(q.topic.trim())) {
    errors.push(`${prefix}: поле topic ("${q.topic}") должно содержать валидный идентификатор темы из topics.js.`);
  }

  // difficulty field
  if (typeof q.difficulty !== 'string' || !VALID_DIFFICULTIES.has(q.difficulty)) {
    errors.push(`${prefix}: поле difficulty должно иметь значение easy, medium или hard.`);
  }

  // explanation field
  if (typeof q.explanation !== 'string' || !q.explanation.trim()) {
    errors.push(`${prefix}: поле explanation обязательно и не должно быть пустым.`);
  }

  return errors;
}

/**
 * Validates a canonical JSON variant payload.
 *
 * Rules:
 * 1. payload must be a non-null object with variantId, title, createdAt, questions.
 * 2. variantId must match /^unt-var-\d{4}-\d{2}-\d{2}-\d{2,}$/.
 * 3. title must be a non-empty string.
 * 4. questions must have exactly 40 items.
 * 5. Questions 1–30: correctAnswers must have exactly 1 index, options length must be 4.
 * 6. Questions 31–40: correctAnswers must have 2 or 3 indices, options length must be 4–6.
 * 7. All correctAnswers indices must be inside options bounds.
 * 8. topic must match valid topics from topics.js.
 * 9. difficulty must be easy, medium, or hard.
 * 10. explanation must be non-empty string.
 *
 * @param {any} payload - The parsed JSON data.
 * @returns {{
 *   isValid: boolean,
 *   errors: string[],
 *   stats: {
 *     totalQuestions: number,
 *     totalPoints: number,
 *     singleChoiceCount: number,
 *     multiChoiceCount: number,
 *     isStandard40UNT: boolean
 *   } | null,
 *   questions: Array<object>,
 *   meta: {
 *     variantId: string,
 *     title: string,
 *     createdAt?: string
 *   }
 * }}
 */
export function validateCanonicalJsonVariant(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      isValid: false,
      errors: ['Данные варианта должны быть валидным JSON-объектом.'],
      stats: null,
      questions: [],
      meta: { variantId: '', title: '' },
    };
  }

  const meta = {
    variantId: typeof payload.variantId === 'string' ? payload.variantId.trim() : '',
    title: typeof payload.title === 'string' ? payload.title.trim() : '',
    createdAt: typeof payload.createdAt === 'string' ? payload.createdAt.trim() : '',
  };

  if (!meta.variantId) {
    errors.push('Поле variantId обязательно и не должно быть пустым.');
  } else if (!VARIANT_ID_REGEX.test(meta.variantId)) {
    errors.push(`Поле variantId ("${meta.variantId}") должно соответствовать формату unt-var-YYYY-MM-DD-NN (например: unt-var-2026-10-12-01).`);
  }

  if (!meta.title) {
    errors.push('Поле title обязательно и не должно быть пустым.');
  }

  if (meta.createdAt && !ISO_8601_DATE_REGEX.test(meta.createdAt)) {
    errors.push(`Поле createdAt ("${meta.createdAt}") должно быть валидной датой ISO-8601 (например: 2026-10-12).`);
  }

  if (!Array.isArray(payload.questions)) {
    return {
      isValid: false,
      errors: [...errors, 'Поле questions обязательно и должно быть массивом из 40 заданий.'],
      stats: null,
      questions: [],
      meta,
    };
  }

  if (payload.questions.length !== 40) {
    errors.push(`Вариант ЕНТ должен содержать ровно 40 заданий (получено: ${payload.questions.length}).`);
  }

  const normalizedQuestions = [];
  let singleChoiceCount = 0;
  let multiChoiceCount = 0;
  let totalPoints = 0;

  payload.questions.forEach((rawQ, idx) => {
    const qErrors = validateCanonicalQuestion(rawQ, idx);
    if (qErrors.length > 0) {
      errors.push(...qErrors);
    }

    if (rawQ && typeof rawQ === 'object') {
      const qNum = idx + 1;
      const isPart2 = qNum >= 31;
      const isMultiple =
        isPart2 ||
        rawQ.type === 'multiple' ||
        (Array.isArray(rawQ.correctAnswers) && rawQ.correctAnswers.length > 1);

      const points = isMultiple ? 2 : 1;
      totalPoints += points;
      if (isMultiple) {
        multiChoiceCount += 1;
      } else {
        singleChoiceCount += 1;
      }

      normalizedQuestions.push({
        id: rawQ.id || `${meta.variantId || 'unt-var'}-${String(qNum).padStart(3, '0')}`,
        number: qNum,
        questionText: typeof rawQ.questionText === 'string' ? rawQ.questionText.trim() : '',
        options: Array.isArray(rawQ.options) ? rawQ.options.map((o) => String(o).trim()) : [],
        correctAnswers: Array.isArray(rawQ.correctAnswers) ? [...rawQ.correctAnswers] : [],
        explanation: typeof rawQ.explanation === 'string' ? rawQ.explanation.trim() : '',
        topic: typeof rawQ.topic === 'string' ? rawQ.topic.trim() : '',
        difficulty: rawQ.difficulty || 'medium',
        type: isMultiple ? 'multiple' : 'single',
        multiple: isMultiple,
        points,
        maxPoints: points,
        version: 1,
      });
    }
  });

  const isStandard40UNT =
    normalizedQuestions.length === 40 &&
    singleChoiceCount === 30 &&
    multiChoiceCount === 10 &&
    totalPoints === 50;

  return {
    isValid: errors.length === 0,
    errors,
    stats: {
      totalQuestions: normalizedQuestions.length,
      totalPoints,
      singleChoiceCount,
      multiChoiceCount,
      isStandard40UNT,
    },
    questions: normalizedQuestions,
    meta,
  };
}
