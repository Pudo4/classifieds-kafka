import { z } from 'zod';

export const createResponseBodySchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});
export type CreateResponseBody = z.infer<typeof createResponseBodySchema>;
