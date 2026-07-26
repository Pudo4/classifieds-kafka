import { describe, expect, it } from 'vitest';
import { validateResponseMessage } from './response.js';

describe('validateResponseMessage', () => {
  it('accepts a normal message', () => {
    expect(validateResponseMessage('Is this still available?')).toBeNull();
  });

  it('rejects an empty message', () => {
    expect(validateResponseMessage('')).toBe('message cannot be empty');
  });

  it('rejects a whitespace-only message', () => {
    expect(validateResponseMessage('   ')).toBe('message cannot be empty');
  });

  it('rejects a message over the length limit', () => {
    expect(validateResponseMessage('x'.repeat(2001))).toContain('too long');
  });

  it('accepts a message exactly at the length limit', () => {
    expect(validateResponseMessage('x'.repeat(2000))).toBeNull();
  });
});
