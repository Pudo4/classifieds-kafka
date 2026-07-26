export interface Response {
  id: string;
  listingId: string;
  userId: string;
  message: string;
  createdAt: Date;
}

const MAX_MESSAGE_LENGTH = 2000;

/** Returns a rejection reason, or `null` if the message is acceptable. */
export function validateResponseMessage(message: string): string | null {
  if (message.trim().length === 0) return 'message cannot be empty';
  if (message.length > MAX_MESSAGE_LENGTH) return `message is too long (max ${MAX_MESSAGE_LENGTH} characters)`;
  return null;
}
