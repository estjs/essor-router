import { shallowSignal } from 'essor';
import { isFunction, isObject, isString } from '@estjs/shared';
import { isBrowser } from './utils';
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
import type { RouteRecord } from './matcher/types';
import type { NavigationFailure } from './errors';
import type { RouterHistory } from './history/common';
import type { PathParserOptions } from './matcher/pathParserRanker';
import type { ErrorListener as _ErrorListener } from './router/lifecycle';

export { _ErrorListener };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type History = 'history' | 'hash' | 'memory';

export interface RouterOptions extends PathParserOptions {
  base?: string;
  history: History | RouterHistory;
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

export type RouteRenderMode = 'csr' | 'ssr' | 'prerender';

export interface PrerenderPathInfo {
  name: string | symbol | undefined;
  pathTemplate: string;
  paths: string[];
  meta: Record<string | number | symbol, any>;
}

// ---------------------------------------------------------------------------
// History factory
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Router factory
// ---------------------------------------------------------------------------

export function createRouter(options: RouterOptions): Router {
  // --- Core infrastructure ---
  const matcher = createRouterMatcher(options.routes, options);
  const parseQuery = options.parseQuery || defaultParseQuery;
  const stringifyQuery = options.stringifyQuery || defaultStringifyQuery;

  const routerHistory: RouterHistory = isString(options.history)
    ? createHistory(options.history, options.base)
    : (options.history as RouterHistory);

  // NOTE: using `shallowSignal` rather than `signal` so essor does not
  // deep-wrap the stored route object in a `reactive()` proxy. This keeps
  // `currentRoute.value` referentially identical to what navigation writes,
  // mirroring vue-router's `shallowRef` semantics.
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

  // --- Scroll handling ---
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

  // --- Lifecycle (must be set up before navigation to break circular deps) ---
  // Temporary forward-references filled once lifecycle is created.
  let markAsReady: <E extends Error = Error>(err?: E) => E | void = () => {};
  let triggerError: (
    error: Error,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
  ) => Promise<unknown> = (error) => Promise.reject(error);

  // --- Shared helpers ---
  const setPendingLocation = (location: RouteLocation) => {
    pendingLocation = location;
  };
  const getPendingLocation = () => pendingLocation;
  const runGuardPipeline = (to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded) =>
    pipeline.navigate(to, from, navigation.checkCanceledNavigationAndReject, (routeToLoad) =>
      navigation.runRouteDataHooks(routeToLoad, true),
    );

  // --- Navigation coordinator ---
  const navigation = createNavigationCoordinator({
    resolve: resolver.resolve,
    locationAsObject: resolver.locationAsObject,
    stringifyQuery,
    currentRoute,
    setPendingLocation,
    getPendingLocation,
    routerHistory,
    triggerAfterEach: pipeline.triggerAfterEach,
    navigate: runGuardPipeline,
    markAsReady: (err) => markAsReady(err),
    triggerError: (error, to, from) => triggerError(error, to, from),
    handleScroll,
  });

  // --- Route management ---
  function addRoute(parentOrRoute: RouteRecordName | RouteRecordRaw, route?: RouteRecordRaw) {
    let parentMatcher;
    if (route) {
      parentMatcher = matcher.getRecordMatcher(parentOrRoute as RouteRecordName);
      if (!parentMatcher) {
        if (__DEV__)
          warn(`Parent route "${String(parentOrRoute)}" not found when adding child route`);
        return () => {};
      }
    }

    const remove = matcher.addRoute((route || parentOrRoute) as RouteRecordRaw, parentMatcher);
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

  // --- Build the router object ---
  const router = {
    currentRoute,
    listening: true,
    options,

    // Route management
    addRoute: addRoute as Router['addRoute'],
    removeRoute,
    clearRoutes,
    hasRoute: (name: RouteRecordName) => !!matcher.getRecordMatcher(name),
    getRoutes: () => matcher.getRoutes().map((m) => m.record),

    // Resolution & navigation
    resolve: resolver.resolve as Router['resolve'],
    push: navigation.push as Router['push'],
    replace: navigation.replace as Router['replace'],
    preloadRoute: navigation.preloadRoute as Router['preloadRoute'],
    go,
    back: () => go(-1),
    forward: () => go(1),

    // Guards
    beforeEach: pipeline.beforeGuards.add,
    beforeResolve: pipeline.beforeResolveGuards.add,
    afterEach: pipeline.afterGuards.add,

    // Lifecycle (patched below once `lifecycle` is available)
    onError: (() => () => {}) as Router['onError'],
    isReady: (async () => {}) as Router['isReady'],
    init: (() => {}) as Router['init'],
    destroy: (() => {}) as Router['destroy'],

    // Prerender
    getPrerenderPaths: () => collectPrerenderPaths(matcher.getRoutes().map((r) => r.record)),
    getPrerenderPathsAsync: async () =>
      collectPrerenderPathsAsync(matcher.getRoutes().map((r) => r.record)),
    getRouteRenderMode: (name: RouteRecordName): RouteRenderMode => {
      const record = matcher.getRecordMatcher(name)?.record;
      if (record?.start?.prerender) return 'prerender';
      if (record?.start?.ssr) return 'ssr';
      return 'csr';
    },
  } satisfies Router;

  // --- Wire up lifecycle (resolves forward-references) ---
  const lifecycle = setupRouterLifecycle({
    router,
    currentRoute,
    routeLocationContext,
    resolve: (to) => resolver.resolve(to as any),
    setPendingLocation,
    pushWithRedirect: navigation.push as any,
    navigate: runGuardPipeline,
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

  return router;
}

// ---------------------------------------------------------------------------
// Prerender path collection
// ---------------------------------------------------------------------------

type PrerenderRecord = { name?: RouteRecordName; path: string; meta: any; start?: any };

function collectPrerenderPaths(records: PrerenderRecord[]): PrerenderPathInfo[] {
  return records
    .filter((r) => r.start?.prerender)
    .flatMap((record) => {
      const paths = resolvePrerenderPaths(record, false) as string[];
      return paths.length > 0
        ? [{ name: record.name, pathTemplate: record.path, paths, meta: record.meta || {} }]
        : [];
    });
}

async function collectPrerenderPathsAsync(
  records: PrerenderRecord[],
): Promise<PrerenderPathInfo[]> {
  const collected: PrerenderPathInfo[] = [];
  for (const record of records) {
    if (!record.start?.prerender) continue;
    const paths = await resolvePrerenderPaths(record, true);
    if (paths.length > 0) {
      collected.push({
        name: record.name,
        pathTemplate: record.path,
        paths,
        meta: record.meta || {},
      });
    }
  }
  return collected;
}

/**
 * Unified prerender path resolver. When `allowAsync` is false, async
 * `prerenderPaths` functions emit a dev warning and return `[]`.
 */
function resolvePrerenderPaths(
  record: { path: string; start?: any },
  allowAsync: true,
): Promise<string[]> | string[];
function resolvePrerenderPaths(record: { path: string; start?: any }, allowAsync: false): string[];
function resolvePrerenderPaths(
  record: { path: string; start?: any },
  allowAsync: boolean,
): Promise<string[]> | string[] {
  const configured = record.start?.prerenderPaths;

  if (configured) {
    if (isFunction(configured)) {
      const result = configured();
      if (result instanceof Promise) {
        if (allowAsync) return result;
        if (__DEV__) {
          warn(
            `Dynamic prerender route "${record.path}" returned an async "start.prerenderPaths". Use "getPrerenderPathsAsync()" to resolve it.`,
          );
        }
        return [];
      }
      return result;
    }
    return configured;
  }

  // Static routes produce their own path; dynamic routes need explicit config
  if (record.path.includes(':')) {
    if (__DEV__) {
      warn(
        `Dynamic prerender route "${record.path}" requires "start.prerenderPaths" to provide concrete output paths.`,
      );
    }
    return [];
  }

  return [record.path];
}
