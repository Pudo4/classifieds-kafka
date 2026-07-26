/**
 * Topic names are versioned with a `.v<n>` suffix (e.g. `listing.events.v1`).
 * A breaking schema change ships as a new topic (`.v2`) rather than mutating
 * `.v1` in place, so existing consumers never see a payload shape they
 * weren't built for.
 */
export function versionedTopic(baseName: string, majorVersion: number): string {
  if (!Number.isInteger(majorVersion) || majorVersion < 1) {
    throw new Error(`majorVersion must be a positive integer, got ${majorVersion}`);
  }
  return `${baseName}.v${majorVersion}`;
}
