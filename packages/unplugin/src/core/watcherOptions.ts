import process from 'node:process';
function getEnv(name: string): string | undefined {
  return process?.env?.[name];
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
