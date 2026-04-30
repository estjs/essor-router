import { isBrowser, noop } from '../utils';

export interface UsePrefetchOptions {
  mode: 'intent' | 'render' | 'viewport' | false;
  id: string;
  preload: () => Promise<unknown>;
}

export function usePrefetch(options: UsePrefetchOptions) {
  let prefetched = false;
  let viewportObserved = false;

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
    if (options.mode !== 'viewport' || viewportObserved) return;
    viewportObserved = true;

    if (typeof IntersectionObserver === 'undefined') {
      runPreload();
      return;
    }

    const target =
      typeof document !== 'undefined'
        ? document.querySelector(`[data-router-prefetch-id="${options.id}"]`)
        : null;

    if (!target) return;

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        runPreload();
        observer.disconnect();
      }
    });

    observer.observe(target);
  };

  return {
    onIntent,
    onRender,
    onViewport,
  };
}
