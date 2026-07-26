import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onShutdownSignal } from './graceful-shutdown.js';

describe('onShutdownSignal', () => {
  let exitSpy: ReturnType<typeof mockExit>;

  function mockExit() {
    return vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    exitSpy = mockExit();
  });

  afterEach(() => {
    vi.useRealTimers();
    exitSpy.mockRestore();
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
  });

  it('exits once cleanup finishes, without waiting for the timeout', async () => {
    let resolveCleanup: () => void = () => {};
    const cleanup = vi.fn(() => new Promise<void>((resolve) => (resolveCleanup = resolve)));
    onShutdownSignal(cleanup, 8000);

    process.emit('SIGTERM');
    expect(cleanup).toHaveBeenCalledOnce();
    expect(exitSpy).not.toHaveBeenCalled();

    resolveCleanup();
    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0));
  });

  it('forces exit if cleanup never resolves -- the real bug found under load: app.close() can hang forever on a live keep-alive connection', async () => {
    const cleanup = vi.fn(() => new Promise<void>(() => {})); // never resolves
    onShutdownSignal(cleanup, 8000);

    process.emit('SIGTERM');
    expect(exitSpy).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(8000);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits even if cleanup rejects', async () => {
    const cleanup = vi.fn(() => Promise.reject(new Error('boom')));
    onShutdownSignal(cleanup, 8000);

    process.emit('SIGTERM');
    await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0));
  });
});
