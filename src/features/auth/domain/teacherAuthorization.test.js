import { describe, expect, it } from 'vitest';
import { isUserTeacher } from './teacherAuthorization';

describe('teacherAuthorization domain', () => {
  it('returns false for null, undefined, or invalid inputs', () => {
    expect(isUserTeacher(null)).toBe(false);
    expect(isUserTeacher(undefined)).toBe(false);
    expect(isUserTeacher('teacher@example.com')).toBe(false);
    expect(isUserTeacher({})).toBe(false);
  });

  it('returns true if user has role: "teacher" or isTeacher: true', () => {
    expect(isUserTeacher({ email: 'user@example.com', role: 'teacher' })).toBe(
      true
    );
    expect(isUserTeacher({ email: 'user@example.com', isTeacher: true })).toBe(
      true
    );
  });

  it('returns true if custom claims indicate teacher', () => {
    expect(
      isUserTeacher({
        email: 'user@example.com',
        customClaims: { teacher: true },
      })
    ).toBe(true);
    expect(
      isUserTeacher({
        email: 'user@example.com',
        customClaims: { role: 'teacher' },
      })
    ).toBe(true);
  });

  it('returns true if user is an admin', () => {
    expect(isUserTeacher({ email: 'admin@example.com', isAdmin: true })).toBe(
      true
    );
    expect(isUserTeacher({ email: 'admin@prepbyte.kz' })).toBe(true);
  });

  it('honors environment variable whitelist', () => {
    const env = 'teacher1@school.kz, mentor@prepbyte.kz';
    expect(isUserTeacher({ email: 'teacher1@school.kz' }, env)).toBe(true);
    expect(isUserTeacher({ email: 'mentor@prepbyte.kz' }, env)).toBe(true);
    expect(isUserTeacher({ email: 'other@school.kz' }, env)).toBe(false);
  });

  it('recognizes built-in demo teacher email patterns', () => {
    expect(isUserTeacher({ email: 'teacher@prepbyte.kz' })).toBe(true);
    expect(isUserTeacher({ email: 'math.teacher@school.kz' })).toBe(true);
    expect(isUserTeacher({ email: 'pedagog@gymnasium.kz' })).toBe(true);
  });

  it('returns false for ordinary student', () => {
    expect(
      isUserTeacher({ email: 'student@gmail.com', role: 'student' })
    ).toBe(false);
    expect(
      isUserTeacher({ email: 'alihan@mail.ru', isAdmin: false, isTeacher: false })
    ).toBe(false);
  });
});
