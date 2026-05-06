export function warn(msg: string, ..._args: unknown[]): void;
export function warn(msg: string, ...args: unknown[]): void {
  console.warn(`[Essor Router warn]: ${msg}`, ...args);
}

export function logRouterError(...args: unknown[]): void {
  if (__DEV__) {
    console.error(...args);
  }
}

/**
 * Portable microtask scheduler. Prefers `queueMicrotask` and falls back to
 * `Promise.resolve().then()` for older runtimes.
 */
export const enqueueMicrotask: (fn: () => void) => void =
  typeof queueMicrotask === 'function' ? queueMicrotask : (fn) => Promise.resolve().then(fn);
