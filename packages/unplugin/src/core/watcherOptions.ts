function getEnv(name: string): string | undefined {
  return globalThis.process?.env?.[name];
}

export function shouldUsePollingWatcher() {
  return !!getEnv('CI') || !!getEnv('VITEST') || getEnv('NODE_ENV') === 'test';
}

export function getPollingWatchOptions() {
  if (!shouldUsePollingWatcher()) {
    return {};
  }

  return {
    usePolling: true,
    interval: 50,
  };
}
