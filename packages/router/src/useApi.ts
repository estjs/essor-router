import { inject, signal, type Signal } from 'essor';
import { routeLocationKey, routerKey } from './injectionSymbols';
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationRawTyped,
} from './types';
import { getActiveRouter, type Router } from './router';

type RouteContainer = Signal<RouteLocationNormalizedLoaded>;
type TickSignal = Signal<number>;
const routerMatchedTicks = new WeakMap<Router, TickSignal>();

function getRouterMatchedTick(router: Router): TickSignal {
  let tick = routerMatchedTicks.get(router);
  if (tick) return tick;
  tick = signal(0);
  router.afterEach(() => {
    tick!.value++;
  });
  routerMatchedTicks.set(router, tick);
  return tick;
}

function asRouteContainer(value: unknown): RouteContainer | null {
  if (value && typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
    return value as RouteContainer;
  }
  return null;
}

function createRouteAccessor(
  routeContainer: RouteContainer,
  matchedTick?: TickSignal,
): RouteLocationNormalizedLoaded {
  return new Proxy({} as RouteLocationNormalizedLoaded, {
    get(_target, key) {
      const current = routeContainer.value as any;
      if (key === 'matched') {
        void matchedTick?.value;
      }
      return current?.[key as keyof RouteLocationNormalizedLoaded];
    },
    has(_target, key) {
      const current = routeContainer.value as any;
      return current != null && key in current;
    },
    ownKeys() {
      const current = routeContainer.value as any;
      return current == null ? [] : Reflect.ownKeys(current);
    },
    getOwnPropertyDescriptor(_target, key) {
      const current = routeContainer.value as any;
      if (current == null) return undefined;
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (descriptor) descriptor.configurable = true;
      return descriptor;
    },
  });
}

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
  const matchedTick = router ? getRouterMatchedTick(router) : undefined;

  const injectedRoute = inject(routeLocationKey as any) as unknown;
  const routeContainer = asRouteContainer(injectedRoute);
  if (routeContainer) {
    return createRouteAccessor(routeContainer, matchedTick);
  }
  if (router) {
    return createRouteAccessor(router.currentRoute, matchedTick);
  }

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
