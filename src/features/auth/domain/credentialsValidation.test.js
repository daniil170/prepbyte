import { describe, expect, it } from 'vitest';
import {
  isSchoolEmailAllowed,
  normalizeSchoolEmail,
  validateCredentials,
} from './credentialsValidation';

describe('credentialsValidation domain', () => {
  describe('normalizeSchoolEmail & isSchoolEmailAllowed', () => {
    it('normalizes uppercase and trimmed emails correctly', () => {
      expect(normalizeSchoolEmail('  STUDENT@PIFAGORSCHOOL.KZ  ')).toBe(
        'student@pifagorschool.kz'
      );
      expect(normalizeSchoolEmail(null)).toBe('');
      expect(normalizeSchoolEmail(undefined)).toBe('');
    });

    it('allows valid @pifagorschool.kz emails', () => {
      expect(isSchoolEmailAllowed('student@pifagorschool.kz')).toBe(true);
      expect(isSchoolEmailAllowed('alihan.serikov@pifagorschool.kz')).toBe(true);
      expect(isSchoolEmailAllowed('STUDENT@PIFAGORSCHOOL.KZ')).toBe(true);
    });

    it('rejects non-pifagorschool.kz and spoofed domain emails', () => {
      expect(isSchoolEmailAllowed('student@gmail.com')).toBe(false);
      expect(isSchoolEmailAllowed('student@mail.ru')).toBe(false);
      expect(isSchoolEmailAllowed('student@fakepifagorschool.kz')).toBe(false);
      expect(isSchoolEmailAllowed('student@pifagorschool.kz.fake.com')).toBe(false);
      expect(isSchoolEmailAllowed('pifagorschool.kz')).toBe(false);
      expect(isSchoolEmailAllowed('@pifagorschool.kz')).toBe(false);
    });
  });

  describe('validateCredentials - Registration', () => {
    it('validates a complete and correct registration payload', () => {
      const result = validateCredentials({
        isRegister: true,
        firstName: 'Данияр',
        lastName: 'Ахметов',
        className: '10А',
        email: 'daniyar@pifagorschool.kz',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('flags missing and invalid registration fields', () => {
      const result = validateCredentials({
        isRegister: true,
        firstName: '',
        lastName: '',
        className: '',
        email: 'student@gmail.com',
        password: '123',
        confirmPassword: '456',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toBeDefined();
      expect(result.errors.lastName).toBeDefined();
      expect(result.errors.className).toBeDefined();
      expect(result.errors.email).toBe(
        'Регистрация разрешена только с почтой @pifagorschool.kz'
      );
      expect(result.errors.password).toBe(
        'Пароль должен содержать минимум 6 символов.'
      );
      expect(result.errors.confirmPassword).toBe('Пароли не совпадают.');
    });
  });

  describe('validateCredentials - Login', () => {
    it('allows valid login email format', () => {
      const result = validateCredentials({
        isRegister: false,
        email: 'admin@prepbyte.kz',
        password: 'password123',
      });

      expect(result.isValid).toBe(true);
    });

    it('rejects invalid email and short password on login', () => {
      const result = validateCredentials({
        isRegister: false,
        email: 'invalid-email',
        password: '12',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Введите корректный email.');
      expect(result.errors.password).toBe(
        'Пароль должен содержать минимум 6 символов.'
      );
    });
  });
});
