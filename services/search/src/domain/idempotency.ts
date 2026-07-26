/**
 * `search`'s idempotency strategy (see README): an incoming event whose
 * version is not strictly greater than what's already indexed is a dup or
 * a reordering artifact, and gets dropped. `currentVersion === null` means
 * nothing is indexed for this id yet, so anything applies.
 */
export function shouldApplySnapshot(incomingVersion: number, currentVersion: number | null): boolean {
  if (currentVersion === null) return true;
  return incomingVersion > currentVersion;
}
