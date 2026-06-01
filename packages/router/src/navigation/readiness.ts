import { useCallbacks } from '../utils/callbacks';
import { warn } from '../core/warning';
import { START_LOCATION_NORMALIZED } from '../types';
import type { RouteLocationNormalized, RouteLocationNormalizedLoaded } from '../types';

export interface ErrorListener {
  (error: Error, to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded): void;
}

type OnReadyCallback = [() => void, (reason?: Error) => void];

export interface ReadinessController {
  ready: boolean;
  markAsReady<E extends Error = Error>(err?: E): E | void;
  triggerError(
    error: Error,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
  ): Promise<unknown>;
  isReady(): Promise<void>;
  onError(handler: ErrorListener): () => void;
  onReadyHandlers(): OnReadyCallback[];
  resetReadyHandlers(): void;
  setReady(value: boolean): void;
  onFirstReady(fn: () => void): void;
}

export function createReadinessController(currentRoute?: {
  value: RouteLocationNormalizedLoaded;
}): ReadinessController {
  const readyHandlers = useCallbacks<OnReadyCallback>();
  const errorListeners = useCallbacks<ErrorListener>();

  let ready = false;
  let firstReadyCallback: (() => void) | null = null;

  function markAsReady<E extends Error = Error>(err?: E): E | void {
    if (!ready) {
      ready = !err;
      readyHandlers.list().forEach(([resolve, reject]) => (err ? reject(err) : resolve()));
      readyHandlers.reset();
      if (!err && firstReadyCallback) {
        firstReadyCallback();
        firstReadyCallback = null;
      }
    }
    return err;
  }

  function triggerError(
    error: Error,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
  ): Promise<unknown> {
    markAsReady(error);
    const list = errorListeners.list();
    if (list.length > 0) {
      list.forEach((handler) => handler(error, to, from));
    } else if (__DEV__) {
      warn('uncaught error during route navigation:');
    }
    return Promise.reject(error);
  }

  function isReady(): Promise<void> {
    if (ready && (!currentRoute || currentRoute.value !== START_LOCATION_NORMALIZED))
      return Promise.resolve();
    return new Promise((resolve, reject) => {
      readyHandlers.add([resolve, reject]);
    });
  }

  return {
    get ready() {
      return ready;
    },
    markAsReady,
    triggerError,
    isReady,
    onError: errorListeners.add,
    onReadyHandlers: () => readyHandlers.list(),
    resetReadyHandlers: () => readyHandlers.reset(),
    setReady(value: boolean) {
      ready = value;
    },
    onFirstReady(fn: () => void) {
      if (ready) {
        fn();
      } else {
        firstReadyCallback = fn;
      }
    },
  };
}
