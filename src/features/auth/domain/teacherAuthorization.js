import { isUserAdmin } from './adminAuthorization';

/**
 * Determines whether an authenticated user has teacher privileges.
 *
 * @param {object} user - User object with email, role, and optional isTeacher/isAdmin flags.
 * @param {string} [teacherEmailsEnv=''] - Comma-separated list of teacher emails from env.
 * @returns {boolean} True if user is authorized as teacher (or admin).
 */
export function isUserTeacher(user, teacherEmailsEnv = '') {
  if (!user || typeof user !== 'object') {
    return false;
  }

  // Administrators always have teacher privileges
  if (isUserAdmin(user)) {
    return true;
  }

  if (
    user.role === 'teacher' ||
    user.isTeacher === true ||
    user.customClaims?.teacher === true ||
    user.customClaims?.role === 'teacher'
  ) {
    return true;
  }

  const email = (user.email || '').trim().toLowerCase();
  if (!email) {
    return false;
  }

  const allowedEmails = teacherEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0 && allowedEmails.includes(email)) {
    return true;
  }

  // Built-in teacher email patterns for development and demonstration
  if (
    email.startsWith('teacher@') ||
    email.includes('teacher') ||
    email.includes('pedagog')
  ) {
    return true;
  }

  return false;
}
