import { createAuthUser } from '../domain/authUser';
import { AUTH_ERROR_CODES, AuthError } from '../domain/authErrors';

const FIREBASE_TO_DOMAIN_ERROR_MAP = {
  'auth/invalid-credential': AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  'auth/wrong-password': AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  'auth/user-not-found': AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  'auth/invalid-login-credentials': AUTH_ERROR_CODES.INVALID_CREDENTIALS,
  'auth/email-already-in-use': AUTH_ERROR_CODES.EMAIL_IN_USE,
  'auth/weak-password': AUTH_ERROR_CODES.WEAK_PASSWORD,
  'auth/invalid-email': AUTH_ERROR_CODES.INVALID_EMAIL,
  'auth/network-request-failed': AUTH_ERROR_CODES.NETWORK,
  'auth/popup-closed-by-user': AUTH_ERROR_CODES.POPUP_CLOSED,
  'auth/cancelled-popup-request': AUTH_ERROR_CODES.POPUP_CLOSED,
  'auth/popup-blocked': AUTH_ERROR_CODES.POPUP_BLOCKED,
  'auth/too-many-requests': AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
};

export function mapFirebaseUserToAuthUser(firebaseUser) {
  if (!firebaseUser) {
    return null;
  }

  return createAuthUser({
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || null,
  });
}

export function mapFirebaseErrorToAuthError(firebaseError) {
  if (firebaseError instanceof AuthError) {
    return firebaseError;
  }

  const code = firebaseError?.code;
  const domainCode =
    FIREBASE_TO_DOMAIN_ERROR_MAP[code] || AUTH_ERROR_CODES.UNKNOWN;

  return new AuthError(domainCode);
}
