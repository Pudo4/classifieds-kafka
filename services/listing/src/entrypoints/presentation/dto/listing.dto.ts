import { z } from 'zod';
import type { ListingDetailsPatch } from '../../../domain/listing.entity.js';

export const createListingBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  priceCents: z.number().int().nonnegative(),
  category: z.string().min(1).max(100),
});
export type CreateListingBody = z.infer<typeof createListingBodySchema>;

export const updateListingBodySchema = createListingBodySchema.partial();
export type UpdateListingBody = z.infer<typeof updateListingBodySchema>;

/**
 * zod's `.partial()` types every field as `T | undefined` (a key that may
 * be present-but-undefined), which `exactOptionalPropertyTypes` rejects as
 * an assignment to `title?: string`. A field absent from the request body
 * is genuinely absent from the parsed object at runtime -- this just makes
 * that fact visible to the type checker too.
 */
export function toDetailsPatch(body: UpdateListingBody): ListingDetailsPatch {
  const patch: ListingDetailsPatch = {};
  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description;
  if (body.priceCents !== undefined) patch.priceCents = body.priceCents;
  if (body.category !== undefined) patch.category = body.category;
  return patch;
}
