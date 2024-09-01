import { useInject } from 'essor';
import { routeLocationKey, routerKey } from './injectionSymbols';
import type { Router } from './router';
import type { RouteLocationNormalizedLoaded } from './types';

/**
 * Returns the router instance. Equivalent to using `$router` inside
 * templates.
 */
export function useRouter(): Router {
  return useInject(routerKey)!;
}

/**
 * Returns the current route location. Equivalent to using `$route` inside
 * templates.
 */
export function useRoute(): RouteLocationNormalizedLoaded {
  return useInject(routeLocationKey)!;
}
