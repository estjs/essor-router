import { type Signal, inject } from 'essor';
import { routeLocationKey, routerKey } from './injectionSymbols';
import { warn } from './warning';
import type { Router } from './router';
import type { RouteLocationNormalizedLoaded, RouteLocationRawTyped } from '../types';

// ---------------------------------------------------------------------------
// Global router fallback — makes useRouter() work for components rendered
// outside RouterView's subtree (e.g. header nav links that are siblings
// of RouterView).
//
// A stack (rather than a single slot) is used so that creating a second router
// does not clobber the first one's fallback, and destroying a router restores
// the previously active one instead of unconditionally clearing it. This keeps
// multi-router scenarios (micro-frontends, concurrent SSR requests) correct.
// ---------------------------------------------------------------------------

interface ActiveEntry {
  router: Router;
  route: RouteLocationNormalizedLoaded;
}

const activeRouterStack: ActiveEntry[] = [];
let activeRouter: Router | undefined;
let activeRoute: RouteLocationNormalizedLoaded | undefined;

function syncActiveFromStack(): void {
  const top = activeRouterStack[activeRouterStack.length - 1];
  activeRouter = top?.router;
  activeRoute = top?.route;
}

export function registerActiveRouter(router: Router): void {
  // Memoize the reactive accessor so repeated useRoute() calls outside of a
  // RouterView (e.g. header siblings) don't allocate a new proxy each time.
  const existing = activeRouterStack.find((entry) => entry.router === router);
  if (existing) {
    // Already registered: re-promote it to the top so it becomes the fallback.
    activeRouterStack.splice(activeRouterStack.indexOf(existing), 1);
    activeRouterStack.push(existing);
  } else {
    activeRouterStack.push({ router, route: createRouteAccessor(router.currentRoute) });
  }
  syncActiveFromStack();
}

export function unregisterActiveRouter(router?: Router): void {
  if (router) {
    const index = activeRouterStack.findIndex((entry) => entry.router === router);
    if (index !== -1) activeRouterStack.splice(index, 1);
  } else {
    // No router specified: drop the current top entry.
    activeRouterStack.pop();
  }
  syncActiveFromStack();
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
