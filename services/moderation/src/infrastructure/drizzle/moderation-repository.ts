import { claimEvent } from '@classifieds/idempotency';
import { insertOutboxMessages } from '@classifieds/outbox';
import type { ModerationRepositoryPort, SaveDecisionParams } from '../../application/ports/moderation-repository.port.js';
import type { Db } from './db.js';
import { moderationDecisions } from './schema.js';
import { mapDecisionToNotificationOutboxMessage, mapDecisionToOutboxMessage } from './moderation-event.mapper.js';

const CONSUMER_GROUP = 'moderation';

export class DrizzleModerationRepository implements ModerationRepositoryPort {
  constructor(private readonly db: Db) {}

  async saveDecision({ decision, sourceEventId, ownerId, listingTitle }: SaveDecisionParams): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const claimed = await claimEvent(tx, CONSUMER_GROUP, sourceEventId);
      if (!claimed) return false;

      await tx.insert(moderationDecisions).values({
        id: decision.id,
        listingId: decision.listingId,
        verdict: decision.verdict,
        reason: decision.reason,
        checkedAt: decision.checkedAt,
      });
      await insertOutboxMessages(tx, [
        mapDecisionToOutboxMessage(decision),
        mapDecisionToNotificationOutboxMessage(decision, ownerId, listingTitle),
      ]);
      return true;
    });
  }
}
