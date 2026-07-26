import { useEffect, useRef } from 'react';
import { BFF_BASE_URL } from '../lib/config.js';
import type { NotificationSummary } from '../lib/types.js';

/**
 * Native `EventSource` can't send custom headers, and identity here is
 * exactly `X-User-Id` (no cookies to ride along) -- so this reads the SSE
 * response body by hand via `fetch`, the same shape of code
 * `notifications.controller.ts` uses server-side to pipe it in the first
 * place. Reconnects on drop (network blip, dev-server restart) with a fixed
 * short delay; deliberately not exponential backoff, this is a demo app
 * running against one local BFF, not a production client.
 */
export function useNotificationStream(userId: string, onMessage: (notification: NotificationSummary) => void): void {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const controller = new AbortController();
    let stopped = false;

    async function connect(): Promise<void> {
      while (!stopped) {
        try {
          const response = await fetch(new URL('/notifications/stream', BFF_BASE_URL), {
            headers: { 'X-User-Id': userId },
            signal: controller.signal,
          });
          if (!response.body) return;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const frames = buffer.split('\n\n');
            buffer = frames.pop() ?? '';
            for (const frame of frames) {
              const dataLine = frame.split('\n').find((line) => line.startsWith('data: '));
              if (!dataLine) continue;
              onMessageRef.current(JSON.parse(dataLine.slice('data: '.length)) as NotificationSummary);
            }
          }
        } catch (error) {
          if (stopped) return;
          console.error('notification stream disconnected, reconnecting', error);
        }
        if (!stopped) await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    void connect();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [userId]);
}
