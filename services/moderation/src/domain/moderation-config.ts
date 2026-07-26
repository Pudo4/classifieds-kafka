export interface ModerationConfig {
  stopWords: readonly string[];
  minPriceCents: number;
  maxPriceCents: number;
  maxLinks: number;
}

/**
 * There's no real ML moderator in this project (see README boundaries) --
 * these are the actual, complete rules. Arbitrary but documented: a
 * marketplace listing under $1 or over $500,000 is more likely a pricing
 * mistake or a scam than a real ask, and more than two links in the
 * description is a spam signal.
 */
export const DEFAULT_MODERATION_CONFIG: ModerationConfig = {
  stopWords: ['scam', 'fake', 'stolen', 'replica', 'counterfeit'],
  minPriceCents: 100,
  maxPriceCents: 50_000_000,
  maxLinks: 2,
};
