export type RetryStage = 'initial' | 'retry-10s' | 'retry-1m';
export type ErrorKind = 'transient' | 'permanent';

export type NextAction = { kind: 'retry'; stage: 'retry-10s' | 'retry-1m'; delayMs: number } | { kind: 'dlq' };

/**
 * The retry ladder: initial failure -> wait 10s, retry -> wait 1m, retry ->
 * give up (DLQ). A permanent error (e.g. the file isn't actually an image)
 * skips straight to DLQ from whatever stage it's at -- waiting and trying
 * again can't fix corrupt data.
 */
export function decideNextAction(stage: RetryStage, errorKind: ErrorKind): NextAction {
  if (errorKind === 'permanent') return { kind: 'dlq' };
  if (stage === 'initial') return { kind: 'retry', stage: 'retry-10s', delayMs: 10_000 };
  if (stage === 'retry-10s') return { kind: 'retry', stage: 'retry-1m', delayMs: 60_000 };
  return { kind: 'dlq' };
}
