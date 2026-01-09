import type { RouteLocationNormalizedLoaded } from './types';
import type { RouteRecordNormalized } from './matcher/types';
import type { Computed, InjectionKey, Signal } from 'essor';
import type { Router } from './router';

/**
 * RouteRecord being rendered by the closest ancestor Router View. Used for
 * `onBeforeRouteUpdate` and `onBeforeRouteLeave`. rvlm stands for Router View
 * Location Matched
 *

 */
export const matchedRouteKey = Symbol(
  __DEV__ ? 'router view location matched' : '',
) as InjectionKey<Computed<RouteRecordNormalized | undefined>>;

/**
 * Allows overriding the router view depth to control which component in
 * `matched` is rendered. rvd stands for Router View Depth
 *

 */
export const viewDepthKey = Symbol(__DEV__ ? 'router view depth' : '') as InjectionKey<
  Signal<number> | number
>;

/**
 * Allows overriding the router instance returned by `useRouter` in tests. r
 * stands for router
 *

 */
export const routerKey = Symbol(__DEV__ ? 'router' : '') as InjectionKey<Router>;

/**
 * Allows overriding the current route returned by `useRoute` in tests. rl
 * stands for route location
 *

 */
export const routeLocationKey = Symbol(__DEV__ ? 'route location' : '') as InjectionKey<
  Signal<RouteLocationNormalizedLoaded>
>;

/**
 * Allows overriding the current route used by router-view. Internally this is
 * used when the `route` prop is passed.
 *

 */
export const routerViewLocationKey = Symbol(__DEV__ ? 'router view location' : '') as InjectionKey<
  Computed<RouteLocationNormalizedLoaded>
>;
