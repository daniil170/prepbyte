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
    expect(isUserTeacher({ email: 'user@pifagorschool.kz', role: 'teacher' })).toBe(
      true
    );
    expect(isUserTeacher({ email: 'user@pifagorschool.kz', isTeacher: true })).toBe(
      true
    );
  });

  it('returns true if custom claims indicate teacher', () => {
    expect(
      isUserTeacher({
        email: 'user@pifagorschool.kz',
        customClaims: { teacher: true },
      })
    ).toBe(true);
    expect(
      isUserTeacher({
        email: 'user@pifagorschool.kz',
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

  it('honors exact environment variable whitelist', () => {
    const env = 'teacher1@pifagorschool.kz, mentor@prepbyte.kz';
    expect(isUserTeacher({ email: 'teacher1@pifagorschool.kz' }, env)).toBe(true);
    expect(isUserTeacher({ email: 'mentor@prepbyte.kz' }, env)).toBe(true);
    expect(isUserTeacher({ email: 'other@pifagorschool.kz' }, env)).toBe(false);
  });

  it('strictly rejects substring and pattern spoofing for ordinary students', () => {
    // Ordinary student emails containing substrings "teacher" or "pedagog"
    expect(isUserTeacher({ email: 'teacherstudent@pifagorschool.kz' })).toBe(false);
    expect(isUserTeacher({ email: 'student_teacher@gmail.com' })).toBe(false);
    expect(isUserTeacher({ email: 'myteacher@pifagorschool.kz' })).toBe(false);
    expect(isUserTeacher({ email: 'pedagog.assistant@school.kz' })).toBe(false);
    expect(isUserTeacher({ email: 'teacher@random.org' })).toBe(false);
  });

  it('returns false for ordinary student', () => {
    expect(
      isUserTeacher({ email: 'student@pifagorschool.kz', role: 'student' })
    ).toBe(false);
    expect(
      isUserTeacher({ email: 'alihan@pifagorschool.kz', isAdmin: false, isTeacher: false })
    ).toBe(false);
  });
});
