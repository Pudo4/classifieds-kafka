/**
 * What one flush cycle applies for one listing -- see README phase 5:
 * views are buffered (see infrastructure/redis/view-buffer.ts) and applied
 * as a batch, not one DB write per page view.
 */
export interface ViewBatch {
  listingId: string;
  incrementBy: number;
}
