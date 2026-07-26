import { useCallback, useEffect, useState } from 'react';
import { listNotifications } from '../lib/api.js';
import { useNotificationStream } from '../hooks/use-notification-stream.js';
import type { NotificationSummary } from '../lib/types.js';

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationSummary[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setNotifications([]);
    setUnread(0);
    setOpen(false);
    listNotifications(userId)
      .then(setNotifications)
      .catch((error: unknown) => console.error('failed to load notification history', error));
  }, [userId]);

  const onMessage = useCallback((notification: NotificationSummary) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnread((prev) => prev + 1);
  }, []);
  useNotificationStream(userId, onMessage);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm"
        onClick={() => {
          setOpen((prev) => !prev);
          setUnread(0);
        }}
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded border border-slate-200 bg-white shadow-lg">
          {notifications.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">Пока пусто</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="p-3 text-sm">
                  <p className="text-slate-800">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString('ru-RU')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
