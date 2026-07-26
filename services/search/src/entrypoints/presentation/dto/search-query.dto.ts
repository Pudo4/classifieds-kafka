import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  minPriceCents: z.coerce.number().int().nonnegative().optional(),
  maxPriceCents: z.coerce.number().int().nonnegative().optional(),
});
export type SearchQueryDto = z.infer<typeof searchQuerySchema>;
