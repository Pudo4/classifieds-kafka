/**
 * `timeoutMs` guards against `cleanup` never resolving -- found the hard
 * way under load-testing: Node's `http.Server.close()` (called deep inside
 * Nest's `app.close()`) refuses to finish while any keep-alive connection
 * is still open, and under continuous incoming traffic a new one always
 * is. Without this, the process just sits there past Docker's SIGTERM
 * grace period (10s by default) and gets SIGKILLed -- which still works,
 * but skips the deliberate ordering below (Kafka cleanup is what the
 * delivery guarantees actually depend on, not the HTTP server closing) and
 * shows up as an ungraceful kill in the logs instead of a clean exit.
 * 8s leaves a 2s margin under that default.
 */
export function onShutdownSignal(cleanup: () => Promise<void>, timeoutMs = 8000): void {
  const handle = (signal: NodeJS.Signals): void => {
    const forceExit = setTimeout(() => {
      console.error(`graceful shutdown (${signal}) did not finish within ${timeoutMs}ms, forcing exit`);
      process.exit(0);
    }, timeoutMs);

    cleanup()
      .catch((err: unknown) => {
        console.error(`error during graceful shutdown (${signal})`, err);
      })
      .finally(() => {
        clearTimeout(forceExit);
        process.exit(0);
      });
  };
  process.once('SIGTERM', handle);
  process.once('SIGINT', handle);
}
