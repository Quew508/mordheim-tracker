import { describe, it, expect } from 'vitest';
import { migrate } from './migrate';

describe('migrate', () => {
  it('returns data unchanged for schemaVersion 1 (identity)', () => {
    const data = { schemaVersion: 1, warbands: [] };
    const result = migrate(data);
    expect(result).toBe(data); // same reference — no copy needed
  });

  it('preserves all fields on a v1 payload', () => {
    const data = { schemaVersion: 1, warbands: [{ id: 'w1' } as never] };
    const result = migrate(data);
    expect(result.schemaVersion).toBe(1);
    expect(result.warbands).toHaveLength(1);
  });
});
