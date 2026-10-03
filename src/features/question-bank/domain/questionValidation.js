import { isValidTopic } from './topics.js';

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

export function validateQuestion(raw) {
  const errors = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return ['Данные вопроса должны быть объектом.'];
  }

  // id validation
  if (typeof raw.id !== 'string' || !raw.id.trim()) {
    errors.push('Поле id обязательно и не должно быть пустым.');
  }

  // topic validation
  if (typeof raw.topic !== 'string' || !isValidTopic(raw.topic.trim())) {
    errors.push('Поле topic должно содержать существующий идентификатор темы.');
  }

  // questionText validation
  if (typeof raw.questionText !== 'string' || !raw.questionText.trim()) {
    errors.push('Поле questionText обязательно и не должно быть пустым.');
  }

  // explanation validation
  if (typeof raw.explanation !== 'string' || !raw.explanation.trim()) {
    errors.push('Поле explanation обязательно и не должно быть пустым.');
  }

  // difficulty validation
  if (!VALID_DIFFICULTIES.has(raw.difficulty)) {
    errors.push(
      'Поле difficulty должно иметь одно из значений: easy, medium, hard.'
    );
  }

  // version validation
  if (
    typeof raw.version !== 'number' ||
    !Number.isInteger(raw.version) ||
    raw.version <= 0
  ) {
    errors.push('Поле version должно быть целым положительным числом.');
  }

  // options validation
  if (!Array.isArray(raw.options)) {
    errors.push('Поле options должно быть массивом строк.');
  } else {
    if (raw.options.length < 2 || raw.options.length > 6) {
      errors.push(
        'Количество вариантов ответа (options) должно быть от 2 до 6.'
      );
    }

    const hasEmptyOption = raw.options.some(
      (opt) => typeof opt !== 'string' || !opt.trim()
    );
    if (hasEmptyOption) {
      errors.push(
        'Все варианты ответа в options должны быть непустыми строками.'
      );
    }

    const uniqueOptions = new Set(
      raw.options.map((opt) => (typeof opt === 'string' ? opt.trim() : opt))
    );
    if (uniqueOptions.size !== raw.options.length) {
      errors.push('Варианты ответа в options не должны дублироваться.');
    }
  }

  // correctAnswers validation
  if (!Array.isArray(raw.correctAnswers)) {
    errors.push('Поле correctAnswers должно быть массивом индексов.');
  } else {
    if (raw.correctAnswers.length === 0) {
      errors.push('Массив correctAnswers не должен быть пустым.');
    }

    const uniqueAnswers = new Set(raw.correctAnswers);
    if (uniqueAnswers.size !== raw.correctAnswers.length) {
      errors.push('Массив correctAnswers не должен содержать дубликатов.');
    }

    const maxIndex = Array.isArray(raw.options) ? raw.options.length - 1 : -1;
    const hasInvalidIndex = raw.correctAnswers.some(
      (idx) =>
        typeof idx !== 'number' ||
        !Number.isInteger(idx) ||
        idx < 0 ||
        idx > maxIndex
    );

    if (hasInvalidIndex) {
      errors.push(
        'Каждый элемент correctAnswers должен быть корректным индексом из диапазона options.'
      );
    }
  }

  return errors;
}

export function validatePublicQuestion(raw) {
  const errors = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return ['Данные вопроса должны быть объектом.'];
  }

  // id validation
  if (typeof raw.id !== 'string' || !raw.id.trim()) {
    errors.push('Поле id обязательно и не должно быть пустым.');
  }

  // topic validation
  if (typeof raw.topic !== 'string' || !isValidTopic(raw.topic.trim())) {
    errors.push('Поле topic должно содержать существующий идентификатор темы.');
  }

  // questionText validation
  if (typeof raw.questionText !== 'string' || !raw.questionText.trim()) {
    errors.push('Поле questionText обязательно и не должно быть пустым.');
  }

  // difficulty validation
  if (!VALID_DIFFICULTIES.has(raw.difficulty)) {
    errors.push(
      'Поле difficulty должно иметь одно из значений: easy, medium, hard.'
    );
  }

  // version validation
  if (
    typeof raw.version !== 'number' ||
    !Number.isInteger(raw.version) ||
    raw.version <= 0
  ) {
    errors.push('Поле version должно быть целым положительным числом.');
  }

  // options validation
  if (!Array.isArray(raw.options)) {
    errors.push('Поле options должно быть массивом строк.');
  } else {
    if (raw.options.length < 2 || raw.options.length > 6) {
      errors.push(
        'Количество вариантов ответа (options) должно быть от 2 до 6.'
      );
    }

    const hasEmptyOption = raw.options.some(
      (opt) => typeof opt !== 'string' || !opt.trim()
    );
    if (hasEmptyOption) {
      errors.push(
        'Все варианты ответа в options должны быть непустыми строками.'
      );
    }

    const uniqueOptions = new Set(
      raw.options.map((opt) => (typeof opt === 'string' ? opt.trim() : opt))
    );
    if (uniqueOptions.size !== raw.options.length) {
      errors.push('Варианты ответа в options не должны дублироваться.');
    }
  }

  return errors;
}
