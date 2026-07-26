import { describe, expect, it } from 'vitest';
import { decideNextAction } from './retry-policy.js';

describe('decideNextAction', () => {
  it('a transient failure on the initial attempt schedules a retry in 10s', () => {
    expect(decideNextAction('initial', 'transient')).toEqual({ kind: 'retry', stage: 'retry-10s', delayMs: 10_000 });
  });

  it('a transient failure after the 10s retry schedules a retry in 1m', () => {
    expect(decideNextAction('retry-10s', 'transient')).toEqual({ kind: 'retry', stage: 'retry-1m', delayMs: 60_000 });
  });

  it('a transient failure after the 1m retry gives up (dlq) -- the ladder is exhausted', () => {
    expect(decideNextAction('retry-1m', 'transient')).toEqual({ kind: 'dlq' });
  });

  it.each<'initial' | 'retry-10s' | 'retry-1m'>(['initial', 'retry-10s', 'retry-1m'])(
    'a permanent failure at stage %s always goes straight to dlq',
    (stage) => {
      expect(decideNextAction(stage, 'permanent')).toEqual({ kind: 'dlq' });
    },
  );
});
