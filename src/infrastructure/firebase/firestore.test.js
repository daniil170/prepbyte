import { describe, expect, it } from 'vitest';
import { db } from './firestore';

describe('firestore instance', () => {
  it('exports initialized Firestore db instance', () => {
    expect(db).toBeDefined();
    expect(db.type).toBe('firestore');
  });
});
