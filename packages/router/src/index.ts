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
export type { ErrorListener, _ErrorListener, Router } from './router';

export { NavigationFailureType, isNavigationFailure } from './errors';
export type { NavigationFailure, ErrorTypes, NavigationRedirectError } from './errors';

export { lazyRouteComponent } from './types';
export { onBeforeRouteLeave, onBeforeRouteUpdate, loadRouteLocation } from './navigationGuards';
export { RouterLink, useLink } from './RouterLink';
export type { RouterLinkProps, RouterLinkOptions, UseLinkReturn } from './RouterLink';
export { guardLinkEvent } from './router/guardEvent';
export { RouterView, RouterViewProps } from './RouterView';
export type { RouterScrollBehavior } from './scrollBehavior';

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
  RouteLocationNamedRaw,
  RouteLocationPathRaw,
  RouteLocationMatched,
  RouteLocationOptions,
  // typed route location (augmented via RouteNamedMap)
  RouteLocationNamedRawTyped,
  RouteLocationRawTyped,
  RouteLocationNormalizedTyped,
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
  RouteComponentLoader,
  RouteLoader,
  RouteLoaderContext,
  RouteSearchValidator,
  RouteStartOptions,
  // RawRouteComponent,
  RouteRecordInfo,
  RouteNamedMap,
  RouteMapGeneric,
  HasTypedRoutes,
  RouteRecordNameTyped,
  // params
  RouteParams,
  RouteParamsRaw,
  RouteParamValue,
  RouteParamValueRaw,
  // guards
  NavigationGuard,
  NavigationGuardNext,
  NavigationGuardWithThis,
  NavigationHookAfter,
} from './types';
