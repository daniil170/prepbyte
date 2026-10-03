const VALID_ROLES = new Set(['student', 'teacher', 'admin']);

/**
 * Parses numeric grade from classroom string like "10A", "11 «Б»", "9".
 *
 * @param {string} className
 * @returns {number|null}
 */
export function parseGradeFromClassName(className) {
  if (!className || typeof className !== 'string') return null;
  const match = className.match(/\b(1[0-2]|[1-9])\b/);
  if (match) {
    const num = Number.parseInt(match[1], 10);
    if (num >= 1 && num <= 12) return num;
  }
  return null;
}

/**
 * Creates an immutable UserProfile domain entity.
 *
 * @param {object} params
 * @param {string} params.uid - Unique user ID matching Firebase Auth UID.
 * @param {string} params.email - User email address.
 * @param {string|null} [params.firstName] - Student first name.
 * @param {string|null} [params.lastName] - Student last name.
 * @param {string|null} [params.className] - Student classroom designation (e.g. "10A").
 * @param {string|null} [params.displayName] - Full name or display name.
 * @param {'student'|'teacher'|'admin'} [params.role='student'] - User role.
 * @param {string|null} [params.teacherId=null] - Assigned teacher UID.
 * @param {string[]} [params.groupIds=[]] - Assigned group IDs.
 * @param {string|null} [params.school='Pifagor School'] - School name.
 * @param {number|null} [params.grade=null] - Student grade number (1-12).
 * @param {number} [params.createdAt] - Creation epoch timestamp in ms.
 * @param {number} [params.updatedAt] - Last update epoch timestamp in ms.
 * @returns {object} Immutable UserProfile entity.
 */
export function createUserProfile({
  uid,
  email,
  firstName = null,
  lastName = null,
  className = null,
  displayName = null,
  role = 'student',
  teacherId = null,
  groupIds = [],
  school = 'Pifagor School',
  grade = null,
  createdAt = Date.now(),
  updatedAt = Date.now(),
} = {}) {
  if (!uid || typeof uid !== 'string' || !uid.trim()) {
    throw new Error('UserProfile must have a non-empty uid.');
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanRole = VALID_ROLES.has(role) ? role : 'student';
  const cleanFirstName = firstName ? String(firstName).trim() : null;
  const cleanLastName = lastName ? String(lastName).trim() : null;
  const cleanClassName = className ? String(className).trim() : null;

  let computedDisplayName = displayName ? String(displayName).trim() : null;
  if (!computedDisplayName && cleanFirstName && cleanLastName) {
    computedDisplayName = `${cleanFirstName} ${cleanLastName}`;
  } else if (!computedDisplayName && cleanFirstName) {
    computedDisplayName = cleanFirstName;
  } else if (!computedDisplayName && cleanEmail) {
    computedDisplayName = cleanEmail.split('@')[0];
  }

  let cleanGrade =
    typeof grade === 'number' && Number.isInteger(grade) && grade > 0 && grade <= 12
      ? grade
      : null;
  if (!cleanGrade && cleanClassName) {
    cleanGrade = parseGradeFromClassName(cleanClassName);
  }

  return Object.freeze({
    uid: uid.trim(),
    email: cleanEmail,
    firstName: cleanFirstName,
    lastName: cleanLastName,
    className: cleanClassName,
    displayName: computedDisplayName,
    role: cleanRole,
    teacherId: teacherId ? String(teacherId).trim() : null,
    groupIds: Array.isArray(groupIds)
      ? Object.freeze([...new Set(groupIds.filter(Boolean))])
      : Object.freeze([]),
    school: school ? String(school).trim() : 'Pifagor School',
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

  if (fields.firstName !== undefined && fields.firstName !== null) {
    if (typeof fields.firstName !== 'string' || fields.firstName.trim().length > 50) {
      errors.push('Имя не должно превышать 50 символов.');
    }
  }

  if (fields.lastName !== undefined && fields.lastName !== null) {
    if (typeof fields.lastName !== 'string' || fields.lastName.trim().length > 50) {
      errors.push('Фамилия не должна превышать 50 символов.');
    }
  }

  if (fields.className !== undefined && fields.className !== null) {
    if (typeof fields.className !== 'string' || fields.className.trim().length > 20) {
      errors.push('Обозначение класса не должно превышать 20 символов.');
    }
  }

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
