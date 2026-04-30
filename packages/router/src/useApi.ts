import { inject, onDestroy } from 'essor';
import { type Signal, effect, shallowReactive, stop } from '@estjs/signals';
import { routeLocationKey, routerKey } from './injectionSymbols';
import { assign } from './utils';
import type {
  RouteLocationNormalizedLoaded,
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
  const routeSignal = inject<Signal<RouteLocationNormalizedLoaded>>(routeLocationKey)!;
  // create reactive
  const route = shallowReactive(assign({}, routeSignal.value));

  let disposed = false;
  const runner = effect(() => {
    if (disposed) return;
    assign(route, routeSignal.value);
  });

  onDestroy(() => {
    disposed = true;
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => stop(runner));
      return;
    }
    Promise.resolve().then(() => stop(runner));
  });

  return route;
}

/**
 * Returns a helper for preloading route components/data.
 */
export function usePreloadRoute() {
  const router = useRouter();
  return (to: RouteLocationRawTyped) => router.preloadRoute(to);
}
