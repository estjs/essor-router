import { nextTick, useSignal } from 'essor';
import { routeLocationKey, routerViewLocationKey } from '../src/injectionSymbols';
import type { RouteLocationNormalizedLoose } from './utils';

export function createMockedRoute(initialValue: RouteLocationNormalizedLoose) {
  const routeRef = useSignal<RouteLocationNormalizedLoose>(initialValue);

  function set(newRoute: RouteLocationNormalizedLoose) {
    routeRef.value = newRoute;
    return nextTick();
  }

  const route = {} as RouteLocationNormalizedLoose;

  for (const key in initialValue) {
    Object.defineProperty(route, key, {
      enumerable: true,
      get: () => routeRef.value[key as keyof RouteLocationNormalizedLoose],
    });
  }

  const value = useSignal(route);

  return {
    value,
    set,
    provides: {
      [routeLocationKey as symbol]: value,
      [routerViewLocationKey as symbol]: routeRef,
    },
  };
}
