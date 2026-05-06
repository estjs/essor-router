import { type Signal, inject, signal } from 'essor';
import { routeLocationKey, routerKey } from './injectionSymbols';
import { type Router, getActiveRouter } from './router';
import type { RouteLocationNormalizedLoaded, RouteLocationRawTyped } from './types';

// ---------------------------------------------------------------------------
// Matched-tick invalidation
// ---------------------------------------------------------------------------

type TickSignal = Signal<number>;

/**
 * Per-router signal that increments after every navigation, forcing consumers
 * of `route.matched` to re-evaluate even when the signal reference stays
 * the same (e.g. lazy-loaded route components mutate the matched array).
 */
const matchedTicks = new WeakMap<Router, TickSignal>();

function ensureMatchedTick(router: Router): TickSignal {
  let tick = matchedTicks.get(router);
  if (!tick) {
    tick = signal(0);
    router.afterEach(() => {
      tick!.value++;
    });
    matchedTicks.set(router, tick);
  }
  return tick;
}

// ---------------------------------------------------------------------------
// Reactive route accessor (Proxy)
// ---------------------------------------------------------------------------

type RouteContainer = Signal<RouteLocationNormalizedLoaded>;

/**
 * Creates a thin Proxy that delegates every property read to
 * `container.value[key]`, keeping all accesses reactive. When
 * `matchedTick` is provided, reading `matched` also touches
 * the tick signal to force re-evaluation on navigation.
 */
export function createRouteAccessor(
  container: RouteContainer,
  matchedTick?: TickSignal,
): RouteLocationNormalizedLoaded {
  return new Proxy({} as RouteLocationNormalizedLoaded, {
    get(_target, key) {
      if (key === 'matched') void matchedTick?.value;
      const current = container.value as any;
      return current?.[key as keyof RouteLocationNormalizedLoaded];
    },
    has(_target, key) {
      const current = container.value as any;
      return current != null && key in current;
    },
    ownKeys() {
      const current = container.value as any;
      return current == null ? [] : Reflect.ownKeys(current);
    },
    getOwnPropertyDescriptor(_target, key) {
      const current = container.value as any;
      if (current == null) return undefined;
      const desc = Object.getOwnPropertyDescriptor(current, key);
      if (desc) desc.configurable = true;
      return desc;
    },
  });
}

// ---------------------------------------------------------------------------
// Public hooks
// ---------------------------------------------------------------------------

/**
 * Returns the router instance. Equivalent to using `$router` inside
 * templates.
 */
export function useRouter(): Router {
  const router = inject(routerKey) || getActiveRouter();
  if (!router) {
    throw new Error(
      'useRouter() requires an active router instance. Create one with createRouter() before calling useRouter().',
    );
  }
  return router;
}

/**
 * Returns the current route location. Equivalent to using `$route` inside
 * templates.
 */
export function useRoute(): RouteLocationNormalizedLoaded {
  const router = inject(routerKey) || getActiveRouter();
  const matchedTick = router ? ensureMatchedTick(router) : undefined;

  // Prefer the narrower route-location provided by the nearest RouterView
  const injected = inject(routeLocationKey as any) as unknown;
  const container =
    injected && typeof injected === 'object' && 'value' in (injected as Record<string, unknown>)
      ? (injected as RouteContainer)
      : null;

  if (container) return createRouteAccessor(container, matchedTick);
  if (router) return createRouteAccessor(router.currentRoute, matchedTick);

  throw new Error(
    'useRoute() requires an active router instance. Create one with createRouter() before calling useRoute().',
  );
}

/**
 * Returns a helper for preloading route components/data.
 */
export function usePreloadRoute() {
  const router = useRouter();
  return (to: RouteLocationRawTyped) => router.preloadRoute(to);
}
