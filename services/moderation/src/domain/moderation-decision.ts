export type ModerationVerdict = 'approved' | 'rejected';

export interface ModerationDecision {
  id: string;
  listingId: string;
  verdict: ModerationVerdict;
  reason: string | null;
  checkedAt: Date;
}

export interface ListingSubmission {
  listingId: string;
  ownerId: string;
  title: string;
  description: string;
  priceCents: number;
}
