import type { ModerationConfig } from './moderation-config.js';
import type { ListingSubmission, ModerationVerdict } from './moderation-decision.js';
import { checkStopWords } from './rules/stop-words.rule.js';
import { checkPriceRange } from './rules/price-range.rule.js';
import { checkLinkCount } from './rules/link-count.rule.js';

export interface EvaluationResult {
  verdict: ModerationVerdict;
  /** Non-null exactly when verdict is 'rejected'; every failing rule's reason, joined. */
  reason: string | null;
}

export function evaluateListing(submission: ListingSubmission, config: ModerationConfig): EvaluationResult {
  const text = `${submission.title} ${submission.description}`;
  const violations = [
    checkStopWords(text, config.stopWords),
    checkPriceRange(submission.priceCents, config.minPriceCents, config.maxPriceCents),
    checkLinkCount(submission.description, config.maxLinks),
  ].filter((violation): violation is string => violation !== null);

  if (violations.length === 0) {
    return { verdict: 'approved', reason: null };
  }
  return { verdict: 'rejected', reason: violations.join('; ') };
}
