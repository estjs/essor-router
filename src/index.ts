export { createWebHistory } from './history/html5';
export { createMemoryHistory } from './history/memory';
export { createWebHashHistory } from './history/hash';
export { createRouterMatcher } from './matcher';

export { parseQuery, stringifyQuery } from './query';
export type {
  LocationQuery,
  LocationQueryRaw,
  LocationQueryValue,
  LocationQueryValueRaw,
} from './query';
export { RouteRecordNormalized } from './matcher/types';
export type { RouterHistory, HistoryState } from './history/common';

export { createRouter, RouterOptions } from './router';
export type { Router } from './router';

export { NavigationFailureType, isNavigationFailure } from './errors';
export type { NavigationFailure, ErrorTypes, NavigationRedirectError } from './errors';

export { onBeforeRouteLeave, onBeforeRouteUpdate, loadRouteLocation } from './navigationGuards';
export { RouterLink } from './RouterLink';
export type { RouterLinkProps, RouterLinkOptions } from './RouterLink';
export { RouterView, RouterViewProps } from './RouterView';

export * from './useApi';
export type {
  // route location
  _RouteLocationBase,
  MatcherLocationAsPath,
  LocationAsRelativeRaw,
  RouteQueryAndHash,
  RouteLocationRaw,
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteParams,
  RouteParamsRaw,
  RouteParamValue,
  RouteParamValueRaw,
  RouteLocationNamedRaw,
  RouteLocationPathRaw,
  RouteLocationMatched,
  RouteLocationOptions,
  // route records
  _RouteRecordBase,
  RouteRecordName,
  RouteRecordRaw,
  RouteRecordRedirectOption,
  RouteRecordSingleView,
  RouteRecordSingleViewWithChildren,
  RouteRecordMultipleViews,
  RouteRecordMultipleViewsWithChildren,
  RouteRecordRedirect,
  RouteMeta,
  RouteComponent,
  // RawRouteComponent,
  NavigationGuard,
  NavigationGuardNext,
  NavigationGuardWithThis,
  NavigationHookAfter,
} from './types';
