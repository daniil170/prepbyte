import { describe, expect, it } from 'vitest';
import { createAuthUser } from './authUser';

describe('authUser domain', () => {
  it('creates an immutable AuthUser with id, email, and displayName', () => {
    const user = createAuthUser({
      id: 'usr-123',
      email: 'student@example.com',
      displayName: 'Daniil',
    });

    expect(user).toEqual({
      id: 'usr-123',
      uid: 'usr-123',
      email: 'student@example.com',
      displayName: 'Daniil',
    });
    expect(Object.isFrozen(user)).toBe(true);
  });

  it('sets displayName to null if omitted', () => {
    const user = createAuthUser({
      id: 'usr-456',
      email: 'test@example.com',
    });

    expect(user.displayName).toBeNull();
  });

  it('throws an error if id is missing', () => {
    expect(() => createAuthUser({ email: 'test@example.com' })).toThrow(
      'AuthUser must have an id'
    );
  });
});
