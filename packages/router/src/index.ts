export { createWebHistory } from './history/html5';
export { createMemoryHistory } from './history/memory';
export { createWebHashHistory } from './history/hash';
export { createRouterMatcher } from './matcher';

export { parseQuery, stringifyQuery } from './core/query';
export type {
  LocationQuery,
  LocationQueryRaw,
  LocationQueryValue,
  LocationQueryValueRaw,
} from './core/query';
export { RouteRecordNormalized } from './matcher/types';
export type { RouterHistory, HistoryState } from './history/common';

export { createRouter, RouterOptions } from './core/router';
export type { ErrorListener, _ErrorListener, Router } from './core/router';
export { definePage, defineRoute, defineStartRoute } from './routeDefinition';
export type {
  DefinePage,
  DefinePageQueryParamOptions,
  DefineRouteLoader,
  DefineRouteLoaderContext,
  DefineRouteSearchValidator,
  DefineRouteStartOptions,
  InferRouteBeforeLoadData,
  InferRouteDefinitionFromDefinePageModule,
  InferRouteLoaderData,
  InferRouteSearch,
  InferRouteStartOptions,
  ParamParserType,
  ParamParserType_Native,
  RouteTreeNodeInfo,
} from './routeDefinition';
export { _mergeRouteRecord } from './routeRecordMerge';
export {
  createFixedResolver,
  FixedResolverParamError,
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
  MatcherPatternQueryParam,
  normalizeRouteRecord,
  PARAM_PARSER_BOOL,
  PARAM_PARSER_INT,
} from './fixedResolver';
export type {
  FixedResolverRecordRaw,
  FixedResolverRecordInput,
  FixedRouteResolver,
  MatcherPatternPath,
  MatcherPatternPathPart,
  ParamParser,
} from './fixedResolver';

export { NavigationFailureType, isNavigationFailure } from './core/errors';
export type { NavigationFailure, ErrorTypes, NavigationRedirectError } from './core/errors';

export { lazyRouteComponent } from './types';
export { onBeforeRouteLeave, onBeforeRouteUpdate, loadRouteLocation } from './navigation/guards';
export { RouterLink, useLink } from './components/RouterLink';
export type { RouterLinkProps, RouterLinkOptions, UseLinkReturn } from './components/RouterLink';
export { guardLinkEvent } from './navigation/guardEvent';
export { RouterView, RouterViewProps } from './components/RouterView';
export type { RouterScrollBehavior } from './core/scrollBehavior';

export * from './core/useApi';
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
