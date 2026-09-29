export function createAuthUser({ id, email, displayName = null } = {}) {
  if (!id) {
    throw new Error('AuthUser must have an id');
  }

  return Object.freeze({
    id,
    email: email || '',
    displayName: displayName || null,
  });
}
