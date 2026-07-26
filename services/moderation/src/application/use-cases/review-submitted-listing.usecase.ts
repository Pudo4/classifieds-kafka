import { randomUUID } from 'node:crypto';
import { evaluateListing } from '../../domain/evaluate-listing.js';
import { DEFAULT_MODERATION_CONFIG } from '../../domain/moderation-config.js';
import type { ListingSubmission, ModerationDecision } from '../../domain/moderation-decision.js';
import type { ModerationRepositoryPort } from '../ports/moderation-repository.port.js';

export interface ReviewSubmittedListingInput {
  sourceEventId: string;
  submission: ListingSubmission;
}

/** Returns `null` when `sourceEventId` was already reviewed (duplicate delivery) -- nothing new happened. */
export async function reviewSubmittedListing(
  input: ReviewSubmittedListingInput,
  repo: ModerationRepositoryPort,
): Promise<ModerationDecision | null> {
  const { verdict, reason } = evaluateListing(input.submission, DEFAULT_MODERATION_CONFIG);
  const decision: ModerationDecision = {
    id: randomUUID(),
    listingId: input.submission.listingId,
    verdict,
    reason,
    checkedAt: new Date(),
  };

  const saved = await repo.saveDecision({
    decision,
    sourceEventId: input.sourceEventId,
    ownerId: input.submission.ownerId,
    listingTitle: input.submission.title,
  });
  return saved ? decision : null;
}
