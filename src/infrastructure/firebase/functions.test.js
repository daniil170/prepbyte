import { describe, expect, it } from 'vitest';
import { functions } from './functions';

describe('functions instance', () => {
  it('exports initialized Functions instance with us-central1 region', () => {
    expect(functions).toBeDefined();
    expect(functions.region).toBe('us-central1');
  });
});
