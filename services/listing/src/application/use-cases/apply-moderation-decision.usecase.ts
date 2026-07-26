import { InvalidTransitionError } from '../../domain/listing.errors.js';
import type { ListingRepositoryPort } from '../ports/listing-repository.port.js';

export interface ApplyModerationDecisionInput {
  listingId: string;
  sourceEventId: string;
  verdict: 'approved' | 'rejected';
  reason: string | null;
}

/**
 * Returns `false` (not an error) for a decision that no longer applies --
 * e.g. the listing was archived before the decision arrived. `archived`
 * is terminal, so this can never become approvable later either; there's
 * nothing to retry, just a stale message to drop.
 */
export async function applyModerationDecision(
  input: ApplyModerationDecisionInput,
  repo: ListingRepositoryPort,
): Promise<boolean> {
  try {
    return await repo.applyEventIdempotently(input.listingId, input.sourceEventId, (listing) => {
      if (input.verdict === 'approved') {
        listing.approve();
      } else {
        listing.reject(input.reason ?? 'rejected by moderation');
      }
    });
  } catch (error) {
    if (error instanceof InvalidTransitionError) return false;
    throw error;
  }
}
