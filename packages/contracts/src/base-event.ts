import { z } from 'zod';

/**
 * Every event on every topic carries this envelope. `version` is the
 * aggregate's version at the time the event was produced (not the schema
 * version, which lives in the topic name) -- consumers use it to reject
 * stale/duplicate events. See packages/contracts README section on
 * idempotency.
 */
export const baseEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  version: z.number().int().positive(),
  producer: z.string().min(1),
});

export type BaseEventEnvelope = z.infer<typeof baseEventEnvelopeSchema>;

export function defineEvent<PayloadSchema extends z.ZodTypeAny>(payloadSchema: PayloadSchema) {
  return baseEventEnvelopeSchema.extend({
    payload: payloadSchema,
  });
}

export type InferEvent<Schema extends z.ZodTypeAny> = z.infer<Schema>;
