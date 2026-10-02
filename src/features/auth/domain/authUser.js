export function createAuthUser({
  id,
  email,
  displayName = null,
  isAdmin = false,
  customClaims = {},
} = {}) {
  if (!id) {
    throw new Error('AuthUser must have an id');
  }

  return Object.freeze({
    id,
    uid: id,
    email: email || '',
    displayName: displayName || null,
    isAdmin: Boolean(isAdmin),
    customClaims: Object.freeze({ ...customClaims }),
  });
}
