import { describe, expect, it } from 'vitest';
import { AUTH_ERROR_CODES, AuthError } from '../domain/authErrors';
import {
  mapFirebaseErrorToAuthError,
  mapFirebaseUserToAuthUser,
} from './authMappers';

describe('authMappers', () => {
  describe('mapFirebaseUserToAuthUser', () => {
    it('returns null when given falsy user', () => {
      expect(mapFirebaseUserToAuthUser(null)).toBeNull();
      expect(mapFirebaseUserToAuthUser(undefined)).toBeNull();
    });

    it('maps firebase user object to domain AuthUser', () => {
      const firebaseUser = {
        uid: 'user-789',
        email: 'test@prepbyte.kz',
        displayName: 'Test User',
      };

      const domainUser = mapFirebaseUserToAuthUser(firebaseUser);

      expect(domainUser).toEqual({
        id: 'user-789',
        uid: 'user-789',
        email: 'test@prepbyte.kz',
        displayName: 'Test User',
        role: 'student',
        isAdmin: false,
        isTeacher: false,
        customClaims: {},
      });
      expect(Object.isFrozen(domainUser)).toBe(true);
    });

    it('maps tokenResult admin claim to isAdmin true and role admin', () => {
      const firebaseUser = {
        uid: 'admin-123',
        email: 'admin@prepbyte.kz',
        displayName: 'Admin User',
      };
      const tokenResult = {
        claims: {
          admin: true,
          role: 'superadmin',
        },
      };

      const domainUser = mapFirebaseUserToAuthUser(firebaseUser, tokenResult);

      expect(domainUser.isAdmin).toBe(true);
      expect(domainUser.isTeacher).toBe(false);
      expect(domainUser.role).toBe('admin');
      expect(domainUser.customClaims).toEqual({
        admin: true,
        role: 'superadmin',
      });
    });

    it('maps tokenResult teacher claim to isTeacher true and role teacher', () => {
      const firebaseUser = {
        uid: 'teacher-123',
        email: 'teacher@prepbyte.kz',
        displayName: 'Teacher User',
      };
      const tokenResult = {
        claims: {
          teacher: true,
        },
      };

      const domainUser = mapFirebaseUserToAuthUser(firebaseUser, tokenResult);

      expect(domainUser.isAdmin).toBe(false);
      expect(domainUser.isTeacher).toBe(true);
      expect(domainUser.role).toBe('teacher');
      expect(domainUser.customClaims).toEqual({
        teacher: true,
      });
    });

    it('handles missing displayName and email safely', () => {
      const firebaseUser = {
        uid: 'user-000',
      };

      const domainUser = mapFirebaseUserToAuthUser(firebaseUser);

      expect(domainUser.id).toBe('user-000');
      expect(domainUser.email).toBe('');
      expect(domainUser.displayName).toBeNull();
      expect(domainUser.isAdmin).toBe(false);
    });
  });

  describe('mapFirebaseErrorToAuthError', () => {
    it('returns existing AuthError as-is', () => {
      const existing = new AuthError(AUTH_ERROR_CODES.NETWORK);
      expect(mapFirebaseErrorToAuthError(existing)).toBe(existing);
    });

    it('maps known Firebase error codes to domain codes', () => {
      const testCases = [
        {
          input: { code: 'auth/invalid-credential' },
          expected: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        },
        {
          input: { code: 'auth/wrong-password' },
          expected: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        },
        {
          input: { code: 'auth/user-not-found' },
          expected: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        },
        {
          input: { code: 'auth/invalid-login-credentials' },
          expected: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        },
        {
          input: { code: 'auth/email-already-in-use' },
          expected: AUTH_ERROR_CODES.EMAIL_IN_USE,
        },
        {
          input: { code: 'auth/weak-password' },
          expected: AUTH_ERROR_CODES.WEAK_PASSWORD,
        },
        {
          input: { code: 'auth/invalid-email' },
          expected: AUTH_ERROR_CODES.INVALID_EMAIL,
        },
        {
          input: { code: 'auth/network-request-failed' },
          expected: AUTH_ERROR_CODES.NETWORK,
        },
        {
          input: { code: 'auth/popup-closed-by-user' },
          expected: AUTH_ERROR_CODES.POPUP_CLOSED,
        },
        {
          input: { code: 'auth/cancelled-popup-request' },
          expected: AUTH_ERROR_CODES.POPUP_CLOSED,
        },
        {
          input: { code: 'auth/popup-blocked' },
          expected: AUTH_ERROR_CODES.POPUP_BLOCKED,
        },
        {
          input: { code: 'auth/too-many-requests' },
          expected: AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
        },
        {
          input: { code: 'auth/other-random-error' },
          expected: AUTH_ERROR_CODES.UNKNOWN,
        },
        { input: null, expected: AUTH_ERROR_CODES.UNKNOWN },
      ];

      testCases.forEach(({ input, expected }) => {
        const error = mapFirebaseErrorToAuthError(input);
        expect(error).toBeInstanceOf(AuthError);
        expect(error.code).toBe(expected);
      });
    });
  });
});
