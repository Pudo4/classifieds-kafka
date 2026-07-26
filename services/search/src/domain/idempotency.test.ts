import { describe, expect, it } from 'vitest';
import { shouldApplySnapshot } from './idempotency.js';

describe('shouldApplySnapshot', () => {
  it('applies when nothing is indexed yet', () => {
    expect(shouldApplySnapshot(1, null)).toBe(true);
  });

  it('applies a strictly newer version', () => {
    expect(shouldApplySnapshot(3, 2)).toBe(true);
  });

  it('drops the exact same version (duplicate delivery)', () => {
    expect(shouldApplySnapshot(2, 2)).toBe(false);
  });

  it('drops an older version arriving after a newer one (reordering)', () => {
    expect(shouldApplySnapshot(1, 3)).toBe(false);
  });
});
