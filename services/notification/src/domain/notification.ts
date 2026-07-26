/**
 * An immutable fact, same shape of choice as `ModerationDecision` and
 * `Favorite` -- there's no lifecycle here beyond "delivered and stored".
 */
export interface Notification {
  id: string;
  userId: string;
  category: string;
  message: string;
  createdAt: Date;
}
