const VALID_ROLES = new Set(['student', 'teacher', 'admin']);

/**
 * Creates an immutable UserProfile domain entity.
 *
 * @param {object} params
 * @param {string} params.uid - Unique user ID matching Firebase Auth UID.
 * @param {string} params.email - User email address.
 * @param {string} [params.displayName] - User full or display name.
 * @param {'student'|'teacher'|'admin'} [params.role='student'] - User role.
 * @param {string|null} [params.teacherId=null] - Assigned teacher UID (if student).
 * @param {string[]} [params.groupIds=[]] - Assigned group IDs.
 * @param {string|null} [params.school=null] - School or educational institution.
 * @param {number|null} [params.grade=null] - Student grade (e.g. 10, 11).
 * @param {number} [params.createdAt] - Creation epoch timestamp in ms.
 * @param {number} [params.updatedAt] - Last update epoch timestamp in ms.
 * @returns {object} Immutable UserProfile entity.
 */
export function createUserProfile({
  uid,
  email,
  displayName = null,
  role = 'student',
  teacherId = null,
  groupIds = [],
  school = null,
  grade = null,
  createdAt = Date.now(),
  updatedAt = Date.now(),
} = {}) {
  if (!uid || typeof uid !== 'string' || !uid.trim()) {
    throw new Error('UserProfile must have a non-empty uid.');
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanRole = VALID_ROLES.has(role) ? role : 'student';
  const cleanGrade =
    typeof grade === 'number' && Number.isInteger(grade) && grade > 0 && grade <= 12
      ? grade
      : null;

  return Object.freeze({
    uid: uid.trim(),
    email: cleanEmail,
    displayName: displayName ? String(displayName).trim() : null,
    role: cleanRole,
    teacherId: teacherId ? String(teacherId).trim() : null,
    groupIds: Array.isArray(groupIds)
      ? Object.freeze([...new Set(groupIds.filter(Boolean))])
      : Object.freeze([]),
    school: school ? String(school).trim() : null,
    grade: cleanGrade,
    createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
    updatedAt: typeof updatedAt === 'number' ? updatedAt : Date.now(),
  });
}

/**
 * Validates editable user profile fields.
 *
 * @param {object} fields
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateUserProfileUpdate(fields = {}) {
  const errors = [];

  if (fields.displayName !== undefined && fields.displayName !== null) {
    if (typeof fields.displayName !== 'string' || fields.displayName.trim().length > 100) {
      errors.push('Имя не должно превышать 100 символов.');
    }
  }

  if (fields.school !== undefined && fields.school !== null) {
    if (typeof fields.school !== 'string' || fields.school.trim().length > 150) {
      errors.push('Название школы не должно превышать 150 символов.');
    }
  }

  if (fields.grade !== undefined && fields.grade !== null) {
    const num = Number(fields.grade);
    if (!Number.isInteger(num) || num < 1 || num > 12) {
      errors.push('Класс должен быть числом от 1 до 12.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
