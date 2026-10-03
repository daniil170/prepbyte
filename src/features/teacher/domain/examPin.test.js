import { describe, expect, it } from 'vitest';
import {
  generateExamPin,
  isValidExamPin,
  normalizeExamPin,
} from './examPin';

describe('examPin domain module', () => {
  it('generates a 6-digit numeric PIN', () => {
    const pin = generateExamPin();
    expect(typeof pin).toBe('string');
    expect(pin).toHaveLength(6);
    expect(/^\d{6}$/.test(pin)).toBe(true);
    const num = Number(pin);
    expect(num).toBeGreaterThanOrEqual(100000);
    expect(num).toBeLessThanOrEqual(999999);
  });

  it('generates pseudo-random and diverse PINs', () => {
    const set = new Set();
    for (let i = 0; i < 50; i++) {
      set.add(generateExamPin());
    }
    expect(set.size).toBeGreaterThan(45);
  });

  it('validates 6-digit PINs correctly', () => {
    expect(isValidExamPin('123456')).toBe(true);
    expect(isValidExamPin('000123')).toBe(true);
    expect(isValidExamPin(999999)).toBe(true);
    expect(isValidExamPin('12345')).toBe(false);
    expect(isValidExamPin('1234567')).toBe(false);
    expect(isValidExamPin('abcdef')).toBe(false);
    expect(isValidExamPin('12a456')).toBe(false);
    expect(isValidExamPin('')).toBe(false);
    expect(isValidExamPin(null)).toBe(false);
    expect(isValidExamPin(undefined)).toBe(false);
  });

  it('normalizes input PIN strings', () => {
    expect(normalizeExamPin(' 123 456 ')).toBe('123456');
    expect(normalizeExamPin('12-34-56')).toBe('123456');
    expect(normalizeExamPin('123456789')).toBe('123456');
    expect(normalizeExamPin('abc')).toBe('');
    expect(normalizeExamPin(null)).toBe('');
  });
});
