import type { ModerationDecision } from '../../domain/moderation-decision.js';
import type { ModerationRepositoryPort, SaveDecisionParams } from '../ports/moderation-repository.port.js';

export class InMemoryModerationRepository implements ModerationRepositoryPort {
  readonly decisions: ModerationDecision[] = [];
  readonly notifiedOwners: Array<{ ownerId: string; listingTitle: string; decision: ModerationDecision }> = [];
  private readonly claimedEventIds = new Set<string>();

  async saveDecision({ decision, sourceEventId, ownerId, listingTitle }: SaveDecisionParams): Promise<boolean> {
    if (this.claimedEventIds.has(sourceEventId)) return false;
    this.claimedEventIds.add(sourceEventId);
    this.decisions.push(decision);
    this.notifiedOwners.push({ ownerId, listingTitle, decision });
    return true;
  }
}
