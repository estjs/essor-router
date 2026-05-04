import { shallowSignal } from 'essor';
import { isBrowser, isObject, isString } from './utils';
import {
  type NavigationGuardWithThis,
  type NavigationHookAfter,
  type RouteLocation,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  type RouteLocationRawTyped,
  type RouteRecordName,
  type RouteRecordRaw,
  START_LOCATION_NORMALIZED,
} from './types';
import { createRouterMatcher } from './matcher';
import { createWebHistory } from './history/html5';
import { createWebHashHistory } from './history/hash';
import { createMemoryHistory } from './history/memory';
import { parseQuery as defaultParseQuery, stringifyQuery as defaultStringifyQuery } from './query';
import {
  type RouterScrollBehavior,
  type _ScrollPositionNormalized,
  getSavedScrollPosition,
  getScrollKey,
  scrollToPosition,
} from './scrollBehavior';
import { createReactiveRoute, createRouteResolver } from './router/routeResolver';
import { createGuardPipeline } from './router/guardPipeline';
import { createNavigationCoordinator } from './router/navigation';
import { setupRouterLifecycle } from './router/lifecycle';
import { warn } from './warning';
import type { Signal } from 'essor';
// NOTE: using `shallowSignal` rather than `signal` so essor does not
// deep-wrap the stored route object in a `reactive()` proxy. This keeps
// `currentRoute.value` referentially identical to what navigation writes,
// mirroring vue-router's `shallowRef` semantics.
import type { RouteRecord } from './matcher/types';
import type { NavigationFailure } from './errors';
import type { RouterHistory } from './history/common';
import type { PathParserOptions } from './matcher/pathParserRanker';
import type { ErrorListener as _ErrorListener } from './router/lifecycle';

export { _ErrorListener };

type History = 'history' | 'hash' | 'memory';

export interface RouterOptions extends PathParserOptions {
  base?: string;
  history?: History | RouterHistory;
  routes: Readonly<RouteRecordRaw[]>;
  scrollBehavior?: RouterScrollBehavior;
  parseQuery?: (search: string) => any;
  stringifyQuery?: (query: any) => string;
  linkActiveClass?: string;
  linkExactActiveClass?: string;
}

export interface Router {
  readonly currentRoute: Signal<RouteLocationNormalizedLoaded>;
  readonly options: RouterOptions;
  listening: boolean;

  addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void;
  addRoute(route: RouteRecordRaw): () => void;
  removeRoute(name: RouteRecordName): void;
  hasRoute(name: RouteRecordName): boolean;
  getRoutes(): RouteRecord[];
  clearRoutes(): void;

  resolve(
    to: RouteLocationRawTyped,
    currentLocation?: RouteLocationNormalizedLoaded,
  ): RouteLocation & { href: string };

  push(to: RouteLocationRawTyped): Promise<NavigationFailure | void | undefined>;
  replace(to: RouteLocationRawTyped): Promise<NavigationFailure | void | undefined>;
  preloadRoute(to: RouteLocationRawTyped): Promise<RouteLocationNormalizedLoaded>;

  back(): ReturnType<Router['go']>;
  forward(): ReturnType<Router['go']>;
  go(delta: number): void;

  beforeEach(guard: NavigationGuardWithThis<undefined>): () => void;
  beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void;
  afterEach(guard: NavigationHookAfter): () => void;

  onError(handler: _ErrorListener): () => void;
  isReady(): Promise<void>;
  init(): void;
  destroy(): void;

  getPrerenderPaths(): PrerenderPathInfo[];
  getPrerenderPathsAsync(): Promise<PrerenderPathInfo[]>;
  getRouteRenderMode(name: RouteRecordName): RouteRenderMode;
}

const routeLocationContextKey = Symbol(__DEV__ ? 'router route location' : '');

type RouterWithRouteLocationContext = Router & {
  [routeLocationContextKey]: RouteLocationNormalizedLoaded;
};

export type RouteRenderMode = 'csr' | 'ssr' | 'prerender';

export interface PrerenderPathInfo {
  name: string | symbol | undefined;
  pathTemplate: string;
  paths: string[];
  meta: Record<string | number | symbol, any>;
}

export function createHistory(mode: History | RouterHistory, base?: string): RouterHistory {
  if (isObject(mode)) return mode as RouterHistory;
  switch (mode) {
    case 'history':
      return createWebHistory(base);
    case 'hash':
      return createWebHashHistory(base);
    case 'memory':
      return createMemoryHistory(base);
    default:
      throw new Error('Invalid history mode');
  }
}

export function createRouter(options: RouterOptions): Router {
  if (!options.history) {
    throw new Error('Provide the "history" option when calling createRouter()');
  }

  const matcher = createRouterMatcher(options.routes, options);
  const parseQuery = options.parseQuery || defaultParseQuery;
  const stringifyQuery = options.stringifyQuery || defaultStringifyQuery;

  const routerHistory: RouterHistory = isString(options.history)
    ? createHistory(options.history, options.base)
    : (options.history as RouterHistory);

  const currentRoute = shallowSignal<RouteLocationNormalizedLoaded>(START_LOCATION_NORMALIZED);
  const routeLocationContext = createReactiveRoute(currentRoute);

  const resolver = createRouteResolver(
    matcher,
    routerHistory,
    parseQuery,
    stringifyQuery,
    () => currentRoute.value,
  );

  const pipeline = createGuardPipeline();
  let pendingLocation: RouteLocation = START_LOCATION_NORMALIZED;

  const handleScroll = (
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    isFirstNavigation: boolean,
    delta = 0,
  ): Promise<unknown> => {
    const { scrollBehavior } = options;
    if (!isBrowser || !scrollBehavior) return Promise.resolve();

    const scrollPosition: _ScrollPositionNormalized | null =
      (!isPush && getSavedScrollPosition(getScrollKey(from.fullPath, delta))) ||
      ((isFirstNavigation || !isPush) && history.state && (history.state as any).scroll) ||
      null;

    return Promise.resolve()
      .then(() => scrollBehavior(to, from, scrollPosition))
      .then((position) => position && scrollToPosition(position));
  };

  let markAsReady: <E extends Error = Error>(err?: E) => E | void = () => {};
  let triggerError: (
    error: Error,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
  ) => Promise<unknown> = (error) => Promise.reject(error);

  const navigation = createNavigationCoordinator({
    resolve: resolver.resolve,
    locationAsObject: resolver.locationAsObject,
    stringifyQuery,
    currentRoute,
    setPendingLocation: (location) => {
      pendingLocation = location;
    },
    getPendingLocation: () => pendingLocation,
    routerHistory,
    triggerAfterEach: pipeline.triggerAfterEach,
    navigate: (to, from) =>
      pipeline.navigate(to, from, navigation.checkCanceledNavigationAndReject, (routeToLoad) =>
        navigation.runRouteDataHooks(routeToLoad, true),
      ),
    markAsReady: (err) => markAsReady(err),
    triggerError: (error, to, from) => triggerError(error, to, from),
    handleScroll,
  });

  function addRoute(parentOrRoute: RouteRecordName | RouteRecordRaw, route?: RouteRecordRaw) {
    if (route) {
      const parentMatcher = matcher.getRecordMatcher(parentOrRoute as RouteRecordName);
      if (!parentMatcher) {
        if (__DEV__) {
          warn(`Parent route "${String(parentOrRoute)}" not found when adding child route`);
        }
        return () => {};
      }

      const remove = matcher.addRoute(route, parentMatcher);
      navigation.clearCaches();
      return () => {
        remove();
        navigation.clearCaches();
      };
    }

    const remove = matcher.addRoute(parentOrRoute as RouteRecordRaw);
    navigation.clearCaches();
    return () => {
      remove();
      navigation.clearCaches();
    };
  }

  function removeRoute(name: RouteRecordName) {
    const recordMatcher = matcher.getRecordMatcher(name);
    if (recordMatcher) {
      matcher.removeRoute(recordMatcher);
      navigation.clearCaches();
    } else if (__DEV__) {
      warn(`Cannot remove non-existent route "${String(name)}"`);
    }
  }

  function clearRoutes() {
    matcher.clearRoutes();
    navigation.clearCaches();
  }

  const go = (delta: number) => routerHistory.go(delta);

  const getAllRouteRecords = () => matcher.getRoutes().map((r) => r.record);
  const getPrerenderPathInfos = () => collectPrerenderPaths(getAllRouteRecords());

  const router = {
    currentRoute,
    listening: true,
    options,
    addRoute: addRoute as Router['addRoute'],
    removeRoute,
    clearRoutes,
    hasRoute: (name: RouteRecordName) => !!matcher.getRecordMatcher(name),
    getRoutes: () => matcher.getRoutes().map((routeMatcher) => routeMatcher.record),
    resolve: resolver.resolve as Router['resolve'],
    push: navigation.push as Router['push'],
    replace: navigation.replace as Router['replace'],
    preloadRoute: navigation.preloadRoute as Router['preloadRoute'],
    go,
    back: () => go(-1),
    forward: () => go(1),
    beforeEach: pipeline.beforeGuards.add,
    beforeResolve: pipeline.beforeResolveGuards.add,
    afterEach: pipeline.afterGuards.add,
    onError: (() => () => {}) as Router['onError'],
    isReady: async () => {},
    init: () => {},
    destroy: () => {},
    getPrerenderPaths: getPrerenderPathInfos,
    getPrerenderPathsAsync: async () => collectPrerenderPathsAsync(getAllRouteRecords()),
    getRouteRenderMode: (name: RouteRecordName): RouteRenderMode => {
      const record = matcher.getRecordMatcher(name)?.record;
      if (record?.start?.prerender) return 'prerender';
      if (record?.start?.ssr) return 'ssr';
      return 'csr';
    },
  } satisfies Router;

  const lifecycle = setupRouterLifecycle({
    router,
    currentRoute,
    resolve: (to) => resolver.resolve(to as any),
    setPendingLocation: (location) => {
      pendingLocation = location;
    },
    pushWithRedirect: navigation.push as any,
    navigate: (to, from) =>
      pipeline.navigate(to, from, navigation.checkCanceledNavigationAndReject, (routeToLoad) =>
        navigation.runRouteDataHooks(routeToLoad, true),
      ),
    finalizeNavigation: navigation.finalizeNavigation,
    triggerAfterEach: pipeline.triggerAfterEach,
    handleRedirectRecord: navigation.handleRedirectRecord,
    clearCaches: navigation.clearCaches,
    routerHistory,
  });

  markAsReady = lifecycle.markAsReady;
  triggerError = lifecycle.triggerError;

  router.onError = lifecycle.onError;
  router.isReady = lifecycle.isReady;
  router.init = () => lifecycle.init(router);
  router.destroy = lifecycle.destroy;

  (router as RouterWithRouteLocationContext)[routeLocationContextKey] = routeLocationContext;

  return router;
}

export function getRouteLocationContext(router: Router): RouteLocationNormalizedLoaded {
  return (router as RouterWithRouteLocationContext)[routeLocationContextKey];
}

function collectPrerenderPaths(
  records: Array<{ name?: RouteRecordName; path: string; meta: any; start?: any }>,
) {
  return records
    .filter((record) => record.start?.prerender)
    .flatMap((record) => {
      const paths = resolvePrerenderPathsSync(record);
      return paths.length === 0
        ? []
        : [
            {
              name: record.name,
              pathTemplate: record.path,
              paths,
              meta: record.meta || {},
            },
          ];
    });
}

async function collectPrerenderPathsAsync(
  records: Array<{ name?: RouteRecordName; path: string; meta: any; start?: any }>,
) {
  const collected: PrerenderPathInfo[] = [];
  for (const record of records) {
    if (!record.start?.prerender) continue;
    const paths = await resolvePrerenderPathsAsync(record);
    if (paths.length === 0) continue;
    collected.push({
      name: record.name,
      pathTemplate: record.path,
      paths,
      meta: record.meta || {},
    });
  }
  return collected;
}

function isDynamicRoutePath(path: string) {
  return path.includes(':');
}

function warnMissingPrerenderPaths(path: string) {
  if (__DEV__) {
    warn(
      `Dynamic prerender route "${path}" requires "start.prerenderPaths" to provide concrete output paths.`,
    );
  }
}

function resolvePrerenderPathsSync(record: { path: string; start?: any }): string[] {
  const configuredPaths = record.start?.prerenderPaths;
  if (configuredPaths) {
    if (typeof configuredPaths === 'function') {
      const resolved = configuredPaths();
      if (resolved instanceof Promise) {
        if (__DEV__) {
          warn(
            `Dynamic prerender route "${record.path}" returned an async "start.prerenderPaths". Use "getPrerenderPathsAsync()" to resolve it.`,
          );
        }
        return [];
      }
      return resolved;
    }
    return configuredPaths;
  }

  if (isDynamicRoutePath(record.path)) {
    warnMissingPrerenderPaths(record.path);
    return [];
  }

  return [record.path];
}

async function resolvePrerenderPathsAsync(record: {
  path: string;
  start?: any;
}): Promise<string[]> {
  const configuredPaths = record.start?.prerenderPaths;
  if (configuredPaths) {
    if (typeof configuredPaths === 'function') {
      return await configuredPaths();
    }
    return configuredPaths;
  }

  if (isDynamicRoutePath(record.path)) {
    warnMissingPrerenderPaths(record.path);
    return [];
  }

  return [record.path];
}
