import { generateExamPin, isValidExamPin } from './examPin';
import { EXAM_STATUS } from './examLifecycle';

export const MIN_EXAM_DURATION_MINUTES = 5;
export const MAX_EXAM_DURATION_MINUTES = 240;
export const DEFAULT_EXAM_DURATION_MINUTES = 60;

/**
 * Validates exam creation / editing inputs.
 *
 * @param {object} input
 * @param {string} input.title
 * @param {string} input.groupId
 * @param {string[]} [input.questionIds]
 * @param {number} [input.durationMinutes]
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateExamInput(input = {}) {
  const errors = {};

  const title = (input.title || '').trim();
  if (!title) {
    errors.title = 'Введите название экзамена.';
  } else if (title.length < 3) {
    errors.title = 'Название должно содержать минимум 3 символа.';
  } else if (title.length > 120) {
    errors.title = 'Название не должно превышать 120 символов.';
  }

  const groupId = (input.groupId || '').trim();
  if (!groupId) {
    errors.groupId = 'Выберите группу учащихся.';
  }

  const durationMinutes = Number(input.durationMinutes);
  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes < MIN_EXAM_DURATION_MINUTES ||
    durationMinutes > MAX_EXAM_DURATION_MINUTES
  ) {
    errors.durationMinutes = `Продолжительность должна быть от ${MIN_EXAM_DURATION_MINUTES} до ${MAX_EXAM_DURATION_MINUTES} минут.`;
  }

  if (input.questionIds !== undefined) {
    if (!Array.isArray(input.questionIds) || input.questionIds.length === 0) {
      errors.questionIds = 'Необходимо выбрать хотя бы один вопрос для экзамена.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Factory for creating a domain Exam entity.
 *
 * @param {object} params
 * @param {string} params.id
 * @param {string} params.title
 * @param {string} [params.description='']
 * @param {string} params.teacherId
 * @param {string} params.groupId
 * @param {string} [params.groupName='']
 * @param {string[]} params.questionIds
 * @param {number} [params.durationMinutes=60]
 * @param {string} [params.pin]
 * @param {string} [params.status='draft']
 * @param {number|(() => number)} [params.now=Date.now]
 * @returns {object} Immutable Exam object.
 */
export function createExam({
  id,
  title,
  description = '',
  teacherId,
  groupId,
  groupName = '',
  questionIds = [],
  durationMinutes = DEFAULT_EXAM_DURATION_MINUTES,
  pin,
  status = EXAM_STATUS.DRAFT,
  now = Date.now,
}) {
  if (!id || typeof id !== 'string') {
    throw new Error('Идентификатор id обязателен для создания экзамена.');
  }
  if (!teacherId || typeof teacherId !== 'string') {
    throw new Error('Идентификатор teacherId обязателен.');
  }

  const validation = validateExamInput({
    title,
    groupId,
    questionIds,
    durationMinutes,
  });

  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError);
  }

  const currentTime = typeof now === 'function' ? now() : now;
  const durationSeconds = durationMinutes * 60;
  const assignedPin = pin && isValidExamPin(pin) ? String(pin) : generateExamPin();

  return Object.freeze({
    id,
    title: title.trim(),
    description: (description || '').trim(),
    teacherId,
    groupId: groupId.trim(),
    groupName: (groupName || '').trim(),
    questionIds: [...questionIds],
    totalQuestions: questionIds.length,
    durationMinutes,
    durationSeconds,
    pin: assignedPin,
    status,
    startsAt: null,
    endsAt: null,
    finishedAt: null,
    createdAt: currentTime,
    updatedAt: currentTime,
  });
}

/**
 * Determines whether a student can access or join an exam.
 *
 * @param {object} exam
 * @param {string} studentGroupId
 * @param {string} [studentId]
 * @param {string[]} [groupStudentIds]
 * @returns {boolean}
 */
export function isExamAccessibleByStudent(
  exam,
  studentGroupId,
  studentId,
  groupStudentIds = []
) {
  if (!exam || typeof exam !== 'object') {
    return false;
  }

  if (
    exam.status !== EXAM_STATUS.WAITING &&
    exam.status !== EXAM_STATUS.ACTIVE
  ) {
    return false;
  }

  if (studentGroupId && exam.groupId === studentGroupId) {
    return true;
  }

  if (
    studentId &&
    Array.isArray(groupStudentIds) &&
    groupStudentIds.includes(studentId)
  ) {
    return true;
  }

  return false;
}
