import { isBrowser, noop } from '../utils';

export interface UsePrefetchOptions {
  mode: 'intent' | 'render' | 'viewport' | false;
  id: string;
  preload: () => Promise<unknown>;
}

export function usePrefetch(options: UsePrefetchOptions) {
  let prefetched = false;
  let viewportObserved = false;
  let observer: IntersectionObserver | undefined;
  let targetEl: Element | null = null;
  let disposed = false;

  const runPreload = () => {
    if (!isBrowser || prefetched) return;
    prefetched = true;
    options.preload().catch(noop);
  };

  const onIntent = () => {
    if (options.mode === 'intent') {
      runPreload();
    }
  };

  const onRender = () => {
    if (options.mode === 'render') {
      runPreload();
    }
  };

  const onViewport = () => {
    // `onViewport` is scheduled via queueMicrotask by RouterLink, so the link
    // may already have unmounted (and disposed) by the time it runs. Bail out so
    // we don't create an observer on a detached element that nothing will clean up.
    if (disposed || options.mode !== 'viewport' || viewportObserved) return;
    viewportObserved = true;

    if (typeof IntersectionObserver === 'undefined') {
      runPreload();
      return;
    }

    const target =
      targetEl ||
      (typeof document !== 'undefined'
        ? document.querySelector(`[data-router-prefetch-id="${options.id}"]`)
        : null);

    if (!target) return;

    const createdObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        runPreload();
        createdObserver.disconnect();
        if (observer === createdObserver) {
          observer = undefined;
        }
      }
    });

    observer = createdObserver;
    createdObserver.observe(target);
  };

  const dispose = () => {
    disposed = true;
    observer?.disconnect();
    observer = undefined;
  };

  const setTarget = (target: Element | null) => {
    targetEl = target;
  };

  return {
    onIntent,
    onRender,
    onViewport,
    dispose,
    setTarget,
  };
}
