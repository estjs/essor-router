import { describe, expect, it, vi } from 'vitest';
import { usePrefetch } from '../../src/navigation/usePrefetch';

describe('usePrefetch', () => {
  it('runs preload on intent only once', async () => {
    const preload = vi.fn(async () => {});
    const prefetch = usePrefetch({
      mode: 'intent',
      id: 'link-1',
      preload,
    });

    prefetch.onIntent();
    prefetch.onIntent();
    await Promise.resolve();

    expect(preload).toHaveBeenCalledTimes(1);
  });

  it('runs preload on render mode', async () => {
    const preload = vi.fn(async () => {});
    const prefetch = usePrefetch({
      mode: 'render',
      id: 'link-2',
      preload,
    });

    prefetch.onRender();
    await Promise.resolve();

    expect(preload).toHaveBeenCalledTimes(1);
  });

  it('runs preload on viewport mode when IntersectionObserver is unavailable', async () => {
    const preload = vi.fn(async () => {}) as unknown as () => Promise<unknown>;
    const originalIO = (globalThis as any).IntersectionObserver;
    (globalThis as any).IntersectionObserver = undefined;

    try {
      const prefetch = usePrefetch({
        mode: 'viewport',
        id: 'link-3',
        preload,
      });

      prefetch.onViewport();
      await Promise.resolve();

      expect(preload).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.IntersectionObserver = originalIO;
    }
  });

  it('observes target and preloads on intersection in viewport mode', async () => {
    const preload = vi.fn(async () => {});
    const target = document.createElement('a');
    target.dataset.routerPrefetchId = 'link-4';
    document.body.append(target);

    const disconnect = vi.fn();
    const observe = vi.fn((el: Element) => {
      expect(el).toBe(target);
    });

    class FakeIntersectionObserver {
      constructor(
        private readonly callback: (entries: Array<{ isIntersecting: boolean }>) => void,
      ) {}

      observe(el: Element) {
        observe(el);
        this.callback([{ isIntersecting: true }]);
      }

      disconnect() {
        disconnect();
      }
    }

    const originalIO = (globalThis as any).IntersectionObserver;
    globalThis.IntersectionObserver = FakeIntersectionObserver as any;

    try {
      const prefetch = usePrefetch({
        mode: 'viewport',
        id: 'link-4',
        preload,
      });

      prefetch.onViewport();
      prefetch.onViewport();
      await Promise.resolve();

      expect(preload).toHaveBeenCalledTimes(1);
      expect(observe).toHaveBeenCalledTimes(1);
      expect(disconnect).toHaveBeenCalledTimes(1);
    } finally {
      target.remove();
      globalThis.IntersectionObserver = originalIO;
    }
  });

  it('does not preload when viewport target is missing', async () => {
    const preload = vi.fn(async () => {});
    class FakeIntersectionObserver {
      observe() {}
      disconnect() {}
    }
    const originalIO = (globalThis as any).IntersectionObserver;

    globalThis.IntersectionObserver = FakeIntersectionObserver as any;

    try {
      const prefetch = usePrefetch({
        mode: 'viewport',
        id: 'missing-target',
        preload,
      });

      prefetch.onViewport();
      await Promise.resolve();

      expect(preload).not.toHaveBeenCalled();
    } finally {
      globalThis.IntersectionObserver = originalIO;
    }
  });

  it('does not preload on viewport hook when mode is disabled', async () => {
    const preload = vi.fn(async () => {});
    const prefetch = usePrefetch({
      mode: false,
      id: 'disabled',
      preload,
    });

    prefetch.onViewport();
    prefetch.onIntent();
    prefetch.onRender();
    await Promise.resolve();

    expect(preload).not.toHaveBeenCalled();
  });

  it('disconnects a pending viewport observer when disposed', () => {
    const preload = vi.fn(() => {}) as unknown as () => Promise<unknown>;
    const target = document.createElement('a');
    target.dataset.routerPrefetchId = 'link-dispose';
    document.body.append(target);

    const disconnect = vi.fn();

    class FakeIntersectionObserver {
      observe() {}

      disconnect() {
        disconnect();
      }
    }

    const originalIO = (globalThis as any).IntersectionObserver;

    globalThis.IntersectionObserver = FakeIntersectionObserver as any;

    try {
      const prefetch = usePrefetch({
        mode: 'viewport',
        id: 'link-dispose',
        preload,
      });

      prefetch.onViewport();
      prefetch.dispose();

      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(preload).not.toHaveBeenCalled();
    } finally {
      target.remove();

      globalThis.IntersectionObserver = originalIO;
    }
  });

  it('observes an explicitly registered detached target in viewport mode', () => {
    const preload = vi.fn(() => {}) as unknown as () => Promise<unknown>;
    const target = document.createElement('a');

    const disconnect = vi.fn();
    const observe = vi.fn((el: Element) => {
      expect(el).toBe(target);
    });

    class FakeIntersectionObserver {
      observe(el: Element) {
        observe(el);
      }

      disconnect() {
        disconnect();
      }
    }

    const originalIO = (globalThis as any).IntersectionObserver;

    globalThis.IntersectionObserver = FakeIntersectionObserver as any;

    try {
      const prefetch = usePrefetch({
        mode: 'viewport',
        id: 'detached-target',
        preload,
      });

      prefetch.setTarget(target);
      prefetch.onViewport();
      prefetch.dispose();

      expect(observe).toHaveBeenCalledTimes(1);
      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(preload).not.toHaveBeenCalled();
    } finally {
      globalThis.IntersectionObserver = originalIO;
    }
  });
});
