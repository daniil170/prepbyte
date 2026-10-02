import { describe, expect, it } from 'vitest';
import { isUserAdmin } from './adminAuthorization';

describe('adminAuthorization domain module', () => {
  it('authorizes user if isAdmin flag is true', () => {
    expect(
      isUserAdmin({ id: 'u1', email: 'student@example.com', isAdmin: true })
    ).toBe(true);
  });

  it('authorizes user if email is in the adminEmailsEnv list', () => {
    const env = 'director@school.kz, teacher@test.kz';
    expect(isUserAdmin({ id: 'u2', email: 'teacher@test.kz' }, env)).toBe(true);
    expect(isUserAdmin({ id: 'u3', email: 'other@test.kz' }, env)).toBe(false);
  });

  it('authorizes user if customClaims.admin is true', () => {
    expect(
      isUserAdmin({
        id: 'u4',
        email: 'user@example.com',
        customClaims: { admin: true },
      })
    ).toBe(true);
  });

  it('authorizes built-in admin identifiers', () => {
    expect(isUserAdmin({ id: 'u5', email: 'admin@prepbyte.kz' })).toBe(true);
    expect(isUserAdmin({ id: 'u6', email: 'admin@school.kz' })).toBe(true);
    expect(isUserAdmin({ id: 'u7', email: 'daniilivakin30@gmail.com' })).toBe(
      true
    );
    expect(isUserAdmin({ id: 'u8', email: 'abishev.ernar@pifagor.kz' })).toBe(
      true
    );
  });

  it('rejects regular users, empty emails, or invalid objects', () => {
    expect(isUserAdmin(null)).toBe(false);
    expect(isUserAdmin({})).toBe(false);
    expect(isUserAdmin({ id: 'u7', email: 'student@gmail.com' })).toBe(false);
  });
});
