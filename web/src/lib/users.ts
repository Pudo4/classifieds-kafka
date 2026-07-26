export interface SeededUser {
  id: string;
  label: string;
}

/**
 * Fixed UUIDs (not random per session) so the same "user" keeps their
 * listings/favorites across reloads and browser tabs -- there's no real
 * auth, just `X-User-Id`, see README "Границы".
 */
export const SEEDED_USERS: readonly SeededUser[] = [
  { id: '11111111-1111-4111-8111-111111111111', label: 'Аня' },
  { id: '22222222-2222-4222-8222-222222222222', label: 'Борис' },
  { id: '33333333-3333-4333-8333-333333333333', label: 'Виктор' },
];
