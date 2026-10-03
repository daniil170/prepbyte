import { describe, expect, it } from 'vitest';
import {
  createUserProfile,
  parseGradeFromClassName,
  validateUserProfileUpdate,
} from './userProfile';

describe('userProfile domain', () => {
  it('creates an immutable UserProfile entity with computed displayName and grade', () => {
    const profile = createUserProfile({
      uid: 'user_123',
      email: 'student@pifagorschool.kz',
      firstName: 'Данияр',
      lastName: 'Ахметов',
      className: '10А',
    });

    expect(profile.uid).toBe('user_123');
    expect(profile.email).toBe('student@pifagorschool.kz');
    expect(profile.firstName).toBe('Данияр');
    expect(profile.lastName).toBe('Ахметов');
    expect(profile.className).toBe('10А');
    expect(profile.displayName).toBe('Данияр Ахметов');
    expect(profile.grade).toBe(10);
    expect(profile.role).toBe('student');
    expect(profile.school).toBe('Pifagor School');
    expect(Object.isFrozen(profile)).toBe(true);
  });

  it('correctly parses numeric grade from classroom strings', () => {
    expect(parseGradeFromClassName('10А')).toBe(10);
    expect(parseGradeFromClassName('11 «Б»')).toBe(11);
    expect(parseGradeFromClassName('9 класс')).toBe(9);
    expect(parseGradeFromClassName('ABC')).toBeNull();
    expect(parseGradeFromClassName('')).toBeNull();
  });

  it('validates profile updates and rejects oversized or invalid fields', () => {
    const invalid = validateUserProfileUpdate({
      firstName: 'A'.repeat(55),
      grade: 15,
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBe(2);

    const valid = validateUserProfileUpdate({
      firstName: 'Алихан',
      lastName: 'Сериков',
      className: '11A',
      grade: 11,
    });
    expect(valid.valid).toBe(true);
    expect(valid.errors).toEqual([]);
  });

  it('throws error when uid is missing', () => {
    expect(() => createUserProfile({ uid: '' })).toThrow(
      'UserProfile must have a non-empty uid.'
    );
  });
});
