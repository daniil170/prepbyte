import { isUserAdmin } from './adminAuthorization';

/**
 * Determines whether an authenticated user has teacher privileges.
 *
 * Trusted sources of teacher role:
 * 1. Administrator privileges (Admins always have teacher access).
 * 2. Explicit role/flag or Custom Claims from Firebase Auth token.
 * 3. Exact matching email present in the configured teacher emails whitelist.
 *
 * Insecure substring heuristics (e.g. email.includes('teacher')) are strictly forbidden.
 *
 * @param {object} user - User object with email, role, and optional isTeacher/isAdmin flags or customClaims.
 * @param {string} [teacherEmailsEnv=''] - Comma-separated list of teacher emails from env.
 * @param {string} [adminEmailsEnv=''] - Comma-separated list of admin emails from env.
 * @returns {boolean} True if user is authorized as teacher (or admin).
 */
export function isUserTeacher(user, teacherEmailsEnv = '', adminEmailsEnv = '') {
  if (!user || typeof user !== 'object') {
    return false;
  }

  // 1. Administrators always have teacher privileges
  if (isUserAdmin(user, adminEmailsEnv)) {
    return true;
  }

  // 2. Verified role or Firebase Custom Claims
  if (
    user.role === 'teacher' ||
    user.isTeacher === true ||
    user.customClaims?.teacher === true ||
    user.customClaims?.role === 'teacher'
  ) {
    return true;
  }

  // 3. Exact email whitelist matching
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

  return false;
}
