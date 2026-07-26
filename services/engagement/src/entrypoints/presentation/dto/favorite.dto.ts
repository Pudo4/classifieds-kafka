import { z } from 'zod';

export const addFavoriteBodySchema = z.object({
  listingId: z.string().uuid(),
});
export type AddFavoriteBody = z.infer<typeof addFavoriteBodySchema>;
