import { describe, expect, it } from 'vitest';
import { validateCredentials } from './credentialsValidation';

describe('validateCredentials', () => {
  it('validates correct email and password for login', () => {
    const result = validateCredentials({
      email: 'user@prepbyte.kz',
      password: 'password123',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('detects empty and invalid email format', () => {
    const emptyResult = validateCredentials({
      email: '',
      password: 'password123',
    });
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.email).toBe('Введите email.');

    const invalidResult = validateCredentials({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors.email).toBe('Введите корректный email.');
  });

  it('detects empty and short passwords (< 6 chars)', () => {
    const emptyResult = validateCredentials({
      email: 'user@prepbyte.kz',
      password: '',
    });
    expect(emptyResult.isValid).toBe(false);
    expect(emptyResult.errors.password).toBe('Введите пароль.');

    const shortResult = validateCredentials({
      email: 'user@prepbyte.kz',
      password: '123',
    });
    expect(shortResult.isValid).toBe(false);
    expect(shortResult.errors.password).toBe(
      'Пароль должен содержать минимум 6 символов.'
    );
  });

  it('validates password confirmation in registration mode', () => {
    const missingConfirm = validateCredentials({
      email: 'user@prepbyte.kz',
      password: 'password123',
      isRegister: true,
    });
    expect(missingConfirm.isValid).toBe(false);
    expect(missingConfirm.errors.confirmPassword).toBe('Подтвердите пароль.');

    const mismatch = validateCredentials({
      email: 'user@prepbyte.kz',
      password: 'password123',
      confirmPassword: 'differentPassword',
      isRegister: true,
    });
    expect(mismatch.isValid).toBe(false);
    expect(mismatch.errors.confirmPassword).toBe('Пароли не совпадают.');

    const matching = validateCredentials({
      email: 'user@prepbyte.kz',
      password: 'password123',
      confirmPassword: 'password123',
      isRegister: true,
    });
    expect(matching.isValid).toBe(true);
    expect(matching.errors).toEqual({});
  });
});
