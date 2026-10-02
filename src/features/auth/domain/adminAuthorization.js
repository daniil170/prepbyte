/**
 * Determines whether an authenticated user has administrative privileges.
 *
 * @param {object} user - User object with email and optional isAdmin flag.
 * @param {string} [adminEmailsEnv=''] - Comma-separated list of admin emails from env.
 * @returns {boolean} True if user is authorized as admin.
 */
export function isUserAdmin(user, adminEmailsEnv = '') {
  if (!user || typeof user !== 'object') {
    return false;
  }

  if (user.isAdmin === true || user.customClaims?.admin === true) {
    return true;
  }

  const email = (user.email || '').trim().toLowerCase();
  if (!email) {
    return false;
  }

  const allowedEmails = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0 && allowedEmails.includes(email)) {
    return true;
  }

  return false;
}
