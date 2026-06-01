import { type Signal, inject } from 'essor';
import { routeLocationKey, routerKey } from './injectionSymbols';
import { warn } from './warning';
import type { Router } from './router';
import type { RouteLocationNormalizedLoaded, RouteLocationRawTyped } from '../types';

// ---------------------------------------------------------------------------
// Global router fallback — makes useRouter() work for components rendered
// outside RouterView's subtree (e.g. header nav links that are siblings
// of RouterView).
// ---------------------------------------------------------------------------

let activeRouter: Router | undefined;
let activeRoute: RouteLocationNormalizedLoaded | undefined;

export function registerActiveRouter(router: Router): void {
  activeRouter = router;
  // Memoize the reactive accessor so repeated useRoute() calls outside of a
  // RouterView (e.g. header siblings) don't allocate a new proxy each time.
  activeRoute = createRouteAccessor(router.currentRoute);
}

export function unregisterActiveRouter(): void {
  activeRouter = undefined;
  activeRoute = undefined;
}

// ---------------------------------------------------------------------------
// Reactive route accessor (Proxy)
// ---------------------------------------------------------------------------

type RouteContainer = Signal<RouteLocationNormalizedLoaded>;

/**
 * Creates a thin Proxy that delegates every property read to
 * `container.value[key]`, keeping all accesses reactive.
 */
export function createRouteAccessor(container: RouteContainer): RouteLocationNormalizedLoaded {
  return new Proxy({} as RouteLocationNormalizedLoaded, {
    get(_target, key) {
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
 * Returns the router instance. Equivalent to using `$router` inside templates.
 */
export function useRouter(): Router {
  const router = inject(routerKey) || activeRouter;
  if (!router) {
    throw new Error(
      'useRouter() requires an active router instance. Make sure a router is active.',
    );
  }
  return router;
}

/**
 * Returns the current route location. Equivalent to using `$route` inside templates.
 */
export function useRoute(): RouteLocationNormalizedLoaded {
  const route = inject(routeLocationKey) || activeRoute;
  if (!route) {
    warn('useRoute() requires an active router instance. Make sure RouterView is mounted.');
  }
  return route as RouteLocationNormalizedLoaded;
}

/**
 * Returns a helper for preloading route components/data.
 */
export function usePreloadRoute() {
  const router = useRouter();
  return (to: RouteLocationRawTyped) => router.preloadRoute(to);
}
