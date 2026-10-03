export function createAuthUser({
  id,
  email,
  displayName = null,
  role = 'student',
  isAdmin = false,
  isTeacher = false,
  customClaims = {},
} = {}) {
  if (!id) {
    throw new Error('AuthUser must have an id');
  }

  const determinedIsAdmin = Boolean(
    isAdmin || customClaims.admin || customClaims.role === 'admin'
  );
  const determinedIsTeacher = Boolean(
    isTeacher || customClaims.teacher || customClaims.role === 'teacher'
  );
  const determinedRole = determinedIsAdmin
    ? 'admin'
    : determinedIsTeacher
      ? 'teacher'
      : role || 'student';

  return Object.freeze({
    id,
    uid: id,
    email: email || '',
    displayName: displayName || null,
    role: determinedRole,
    isAdmin: determinedIsAdmin,
    isTeacher: determinedIsTeacher,
    customClaims: Object.freeze({ ...customClaims }),
  });
}
