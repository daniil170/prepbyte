import { describe, expect, it } from 'vitest';
import { createUserProfile, validateUserProfileUpdate } from './userProfile';

describe('userProfile domain', () => {
  it('creates an immutable UserProfile with defaults', () => {
    const profile = createUserProfile({
      uid: 'user-100',
      email: 'student@example.com',
      displayName: 'Daniil',
    });

    expect(profile.uid).toBe('user-100');
    expect(profile.email).toBe('student@example.com');
    expect(profile.displayName).toBe('Daniil');
    expect(profile.role).toBe('student');
    expect(profile.teacherId).toBeNull();
    expect(profile.groupIds).toEqual([]);
    expect(profile.school).toBeNull();
    expect(profile.grade).toBeNull();
    expect(typeof profile.createdAt).toBe('number');
    expect(Object.isFrozen(profile)).toBe(true);
    expect(Object.isFrozen(profile.groupIds)).toBe(true);
  });

  it('throws an error if uid is missing or empty', () => {
    expect(() => createUserProfile({ email: 'test@example.com' })).toThrow(
      'UserProfile must have a non-empty uid.'
    );
    expect(() =>
      createUserProfile({ uid: '   ', email: 'test@example.com' })
    ).toThrow('UserProfile must have a non-empty uid.');
  });

  it('sanitizes and supports all parameters', () => {
    const profile = createUserProfile({
      uid: 'user-200',
      email: 'TEACHER@School.KZ  ',
      displayName: '  Ernar Abishev  ',
      role: 'teacher',
      teacherId: 'teacher-99',
      groupIds: ['g1', 'g2', 'g1'],
      school: '  Pifagor School  ',
      grade: 11,
      createdAt: 1000,
      updatedAt: 2000,
    });

    expect(profile.email).toBe('teacher@school.kz');
    expect(profile.displayName).toBe('Ernar Abishev');
    expect(profile.role).toBe('teacher');
    expect(profile.teacherId).toBe('teacher-99');
    expect(profile.groupIds).toEqual(['g1', 'g2']);
    expect(profile.school).toBe('Pifagor School');
    expect(profile.grade).toBe(11);
    expect(profile.createdAt).toBe(1000);
    expect(profile.updatedAt).toBe(2000);
  });

  it('validates profile updates properly', () => {
    expect(validateUserProfileUpdate({ displayName: 'Alex' }).valid).toBe(true);
    expect(validateUserProfileUpdate({ grade: 10 }).valid).toBe(true);
    expect(validateUserProfileUpdate({ grade: 15 }).valid).toBe(false);
    expect(validateUserProfileUpdate({ grade: 0 }).valid).toBe(false);
    expect(
      validateUserProfileUpdate({ displayName: 'a'.repeat(101) }).valid
    ).toBe(false);
  });
});
