import { describe, it, expect } from 'vitest';
import { createId } from './ids';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('createId', () => {
  it('returns a valid UUID v4 string', () => {
    const id = createId();
    expect(typeof id).toBe('string');
    expect(id).toMatch(UUID_V4_REGEX);
  });

  it('returns a unique value on each call', () => {
    const ids = new Set(Array.from({ length: 20 }, () => createId()));
    expect(ids.size).toBe(20);
  });
});
