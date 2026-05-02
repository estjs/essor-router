import { inject } from 'essor';
import { routeLocationKey, routerKey } from './injectionSymbols';
import type {
  RouteLocationNormalizedTyped,
  RouteLocationRawTyped,
} from './types';
import type { Router } from './router';

/**
 * Returns the router instance. Equivalent to using `$router` inside
 * templates.
 */
export function useRouter(): Router {
  return inject(routerKey)!;
}

/**
 * Returns the current route location. Equivalent to using `$route` inside
 * templates.
 */
export function useRoute(): RouteLocationNormalizedTyped {
  return inject(routeLocationKey)!;
}

/**
 * Returns a helper for preloading route components/data.
 */
export function usePreloadRoute() {
  const router = useRouter();
  return (to: RouteLocationRawTyped) => router.preloadRoute(to);
}
