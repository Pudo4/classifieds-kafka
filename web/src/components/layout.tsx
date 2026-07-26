import { NavLink, Outlet } from 'react-router-dom';
import { useCurrentUser } from '../hooks/current-user.js';
import { UserSwitcher } from './user-switcher.js';
import { NotificationBell } from './notification-bell.js';

const NAV_LINK_CLASS = ({ isActive }: { isActive: boolean }): string =>
  `rounded px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export function Layout() {
  const { user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <nav className="flex items-center gap-2">
          <NavLink to="/" end className={NAV_LINK_CLASS}>
            Лента
          </NavLink>
          <NavLink to="/create" className={NAV_LINK_CLASS}>
            Создать
          </NavLink>
          <NavLink to="/mine" className={NAV_LINK_CLASS}>
            Мои
          </NavLink>
        </nav>
        <div className="flex items-center gap-4">
          <UserSwitcher />
          <NotificationBell key={user.id} userId={user.id} />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
