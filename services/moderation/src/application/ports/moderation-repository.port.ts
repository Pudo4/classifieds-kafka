import type { ModerationDecision } from '../../domain/moderation-decision.js';

export const MODERATION_REPOSITORY = Symbol('MODERATION_REPOSITORY');

export interface SaveDecisionParams {
  decision: ModerationDecision;
  /** The `listing.events.v1` eventId that triggered this review -- claimed for idempotency in the same transaction as the save. */
  sourceEventId: string;
  /** Not part of the decision itself -- only here so the repository can also address a notification.requests.v1 message to the right user. */
  ownerId: string;
  listingTitle: string;
}

export interface ModerationRepositoryPort {
  /** `false` means `sourceEventId` was already processed (duplicate delivery) and nothing was written. */
  saveDecision(params: SaveDecisionParams): Promise<boolean>;
}
