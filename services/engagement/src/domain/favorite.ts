/**
 * An immutable fact, not a stateful aggregate -- same shape of choice as
 * `moderation`'s `ModerationDecision`. "Un-favoriting" is the repository
 * deleting the row, not a status flip on this object; there's no lifecycle
 * to model beyond "exists" / "doesn't exist", which `UNIQUE(user_id,
 * listing_id)` already enforces at the DB level.
 */
export interface Favorite {
  userId: string;
  listingId: string;
  createdAt: Date;
}
