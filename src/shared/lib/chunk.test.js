import { describe, expect, it } from 'vitest';
import { chunk } from './chunk';

describe('chunk', () => {
  it('returns empty array when input is not an array or empty', () => {
    expect(chunk([], 10)).toEqual([]);
    expect(chunk(null, 10)).toEqual([]);
    expect(chunk(undefined, 10)).toEqual([]);
  });

  it('returns empty array when size is non-positive or invalid', () => {
    expect(chunk([1, 2, 3], 0)).toEqual([]);
    expect(chunk([1, 2, 3], -1)).toEqual([]);
    expect(chunk([1, 2, 3], '2')).toEqual([]);
  });

  it('splits array into evenly sized chunks', () => {
    const list = [1, 2, 3, 4, 5, 6];
    expect(chunk(list, 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it('handles array not evenly divisible by chunk size', () => {
    const list = ['a', 'b', 'c', 'd', 'e'];
    expect(chunk(list, 2)).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
  });

  it('returns single chunk if size exceeds array length', () => {
    const list = [1, 2, 3];
    expect(chunk(list, 10)).toEqual([[1, 2, 3]]);
  });
});
