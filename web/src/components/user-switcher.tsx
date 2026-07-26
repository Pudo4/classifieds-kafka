import { useCurrentUser } from '../hooks/current-user.js';

export function UserSwitcher() {
  const { user, users, setUserId } = useCurrentUser();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      Войти как
      <select
        className="rounded border border-slate-300 bg-white px-2 py-1 text-slate-900"
        value={user.id}
        onChange={(e) => setUserId(e.target.value)}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.label}
          </option>
        ))}
      </select>
    </label>
  );
}
