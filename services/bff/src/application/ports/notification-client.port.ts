export interface NotificationSummary {
  id: string;
  category: string;
  message: string;
  createdAt: string;
}

/**
 * Only the history read -- the live SSE stream is pure plumbing (pipe the
 * upstream response body through) with no business logic to isolate for
 * testing, so it lives directly on the concrete HTTP client instead of
 * being forced into a port method here.
 */
export interface NotificationClientPort {
  list(userId: string): Promise<NotificationSummary[]>;
}
