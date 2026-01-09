import { type Signal, effect, inject, shallowReactive } from 'essor';
import { routeLocationKey, routerKey } from './injectionSymbols';
import { assign } from './utils';
import type { RouteLocationNormalizedLoaded } from './types';
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
export function useRoute() {
  const routeSignal = inject<Signal<RouteLocationNormalizedLoaded>>(routeLocationKey)!;
  // create reactive
  const route = shallowReactive(assign({}, routeSignal.value));

  effect(() => {
    assign(route, routeSignal.value);
  });

  return route;
}
