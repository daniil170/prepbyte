import { describe, expect, it } from 'vitest';
import { pluralize } from './pluralize';

describe('pluralize Russian helper', () => {
  const forms = ['вопрос', 'вопроса', 'вопросов'];

  it('handles "one" form ending in 1 (except 11)', () => {
    expect(pluralize(1, forms)).toBe('вопрос');
    expect(pluralize(21, forms)).toBe('вопрос');
    expect(pluralize(101, forms)).toBe('вопрос');
    expect(pluralize(521, forms)).toBe('вопрос');
  });

  it('handles "few" form ending in 2, 3, 4 (except 12, 13, 14)', () => {
    expect(pluralize(2, forms)).toBe('вопроса');
    expect(pluralize(3, forms)).toBe('вопроса');
    expect(pluralize(4, forms)).toBe('вопроса');
    expect(pluralize(22, forms)).toBe('вопроса');
    expect(pluralize(23, forms)).toBe('вопроса');
    expect(pluralize(24, forms)).toBe('вопроса');
    expect(pluralize(102, forms)).toBe('вопроса');
  });

  it('handles "many" form for teen numbers (11, 12, 13, 14) and 111', () => {
    expect(pluralize(11, forms)).toBe('вопросов');
    expect(pluralize(12, forms)).toBe('вопросов');
    expect(pluralize(14, forms)).toBe('вопросов');
    expect(pluralize(111, forms)).toBe('вопросов');
    expect(pluralize(112, forms)).toBe('вопросов');
    expect(pluralize(114, forms)).toBe('вопросов');
  });

  it('handles "many" form for 0, 5-20, 25-30', () => {
    expect(pluralize(0, forms)).toBe('вопросов');
    expect(pluralize(5, forms)).toBe('вопросов');
    expect(pluralize(6, forms)).toBe('вопросов');
    expect(pluralize(10, forms)).toBe('вопросов');
    expect(pluralize(15, forms)).toBe('вопросов');
    expect(pluralize(20, forms)).toBe('вопросов');
    expect(pluralize(25, forms)).toBe('вопросов');
    expect(pluralize(30, forms)).toBe('вопросов');
    expect(pluralize(40, forms)).toBe('вопросов');
  });

  it('handles negative numbers by absolute value', () => {
    expect(pluralize(-1, forms)).toBe('вопрос');
    expect(pluralize(-2, forms)).toBe('вопроса');
    expect(pluralize(-5, forms)).toBe('вопросов');
    expect(pluralize(-11, forms)).toBe('вопросов');
    expect(pluralize(-12, forms)).toBe('вопросов');
    expect(pluralize(-14, forms)).toBe('вопросов');
    expect(pluralize(-21, forms)).toBe('вопрос');
    expect(pluralize(-111, forms)).toBe('вопросов');
  });

  it('supports passing forms as three arguments', () => {
    expect(pluralize(1, 'балл', 'балла', 'баллов')).toBe('балл');
    expect(pluralize(2, 'балл', 'балла', 'баллов')).toBe('балла');
    expect(pluralize(5, 'балл', 'балла', 'баллов')).toBe('баллов');
  });

  it('gracefully handles non-numeric inputs', () => {
    expect(pluralize(null, forms)).toBe('вопросов');
    expect(pluralize(undefined, forms)).toBe('вопросов');
    expect(pluralize('not a number', forms)).toBe('вопросов');
  });
});
