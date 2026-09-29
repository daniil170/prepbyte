import { describe, expect, it } from 'vitest';
import { scrambleText } from './scrambleText';

describe('scrambleText', () => {
  it('returns empty string when given empty input', () => {
    expect(scrambleText('', 0.5)).toBe('');
    expect(scrambleText(null, 0.5)).toBe('');
    expect(scrambleText(undefined, 0.5)).toBe('');
  });

  it('scrambles all characters when progress is 0 using deterministic random function', () => {
    // deterministic random alternating between 0 and 1
    let toggle = 0;
    const deterministicRandom = () => {
      toggle = 1 - toggle;
      return toggle ? 0.2 : 0.8; // 0.2 -> '0', 0.8 -> '1'
    };

    const result = scrambleText('PrepByte', 0, deterministicRandom);
    expect(result).toHaveLength(8);
    expect(result).toMatch(/^[01]{8}$/);
    expect(result).toBe('01010101');
  });

  it('resolves exactly half of characters at progress 0.5 and scrambles remaining', () => {
    const alwaysZero = () => 0.1;
    const result = scrambleText('PrepByte', 0.5, alwaysZero);
    // Length is 8. Half resolved = 4 characters ('Prep'), last 4 are '0'
    expect(result).toBe('Prep0000');
  });

  it('resolves completely when progress is 1', () => {
    const alwaysZero = () => 0.1;
    const result = scrambleText('PrepByte', 1, alwaysZero);
    expect(result).toBe('PrepByte');
  });

  it('preserves spaces at any progress', () => {
    const alwaysOne = () => 0.9;
    const result = scrambleText('Prep Byte Platform', 0, alwaysOne);
    expect(result).toBe('1111 1111 11111111');
    expect(result[4]).toBe(' ');
    expect(result[9]).toBe(' ');
  });

  it('clamps progress < 0 and > 1 safely', () => {
    const alwaysZero = () => 0.1;
    expect(scrambleText('Prep', -0.5, alwaysZero)).toBe('0000');
    expect(scrambleText('Prep', 1.5, alwaysZero)).toBe('Prep');
  });
});
