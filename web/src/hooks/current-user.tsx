import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { SEEDED_USERS, type SeededUser } from '../lib/users.js';

const STORAGE_KEY = 'classifieds:currentUserId';

interface CurrentUserContextValue {
  user: SeededUser;
  users: readonly SeededUser[];
  setUserId: (id: string) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

function loadInitialUser(): SeededUser {
  const savedId = localStorage.getItem(STORAGE_KEY);
  const first = SEEDED_USERS[0];
  if (!first) throw new Error('SEEDED_USERS must not be empty');
  return SEEDED_USERS.find((u) => u.id === savedId) ?? first;
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SeededUser>(loadInitialUser);

  const value = useMemo<CurrentUserContextValue>(
    () => ({
      user,
      users: SEEDED_USERS,
      setUserId: (id: string) => {
        const next = SEEDED_USERS.find((u) => u.id === id);
        if (!next) return;
        localStorage.setItem(STORAGE_KEY, next.id);
        setUser(next);
      },
    }),
    [user],
  );

  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error('useCurrentUser must be used within CurrentUserProvider');
  return ctx;
}
