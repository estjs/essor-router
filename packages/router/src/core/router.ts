import { shallowSignal } from 'essor';
import { isFunction, isObject, isString } from '@estjs/shared';
import { isBrowser } from '../utils';
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
} from '../types';
import { createRouterMatcher } from '../matcher';
import { createWebHistory } from '../history/html5';
import { createWebHashHistory } from '../history/hash';
import { createMemoryHistory } from '../history/memory';
import { createReactiveRoute, createRouteResolver } from '../navigation/routeResolver';
import { createGuardPipeline } from '../navigation/guardPipeline';
import { createNavigationCoordinator } from '../navigation/navigation';
import { setupRouterLifecycle } from '../navigation/lifecycle';
import { type ErrorListener, createReadinessController } from '../navigation/readiness';
import { registerActiveRouter } from './useApi';
import {
  type RouterScrollBehavior,
  type _ScrollPositionNormalized,
  createScrollPositionStore,
  getScrollKey,
  scrollToPosition,
} from './scrollBehavior';
import { parseQuery as defaultParseQuery, stringifyQuery as defaultStringifyQuery } from './query';
import { warn } from './warning';
import type { Signal } from 'essor';
import type { RouteRecord } from '../matcher/types';
import type { NavigationFailure } from './errors';
import type { RouterHistory } from '../history/common';
import type { PathParserOptions } from '../matcher/pathParserRanker';

export type { ErrorListener, ErrorListener as _ErrorListener };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type History = 'history' | 'hash' | 'memory';

export interface RouterOptions extends PathParserOptions {
  /**
   * Base URL used by string history modes and generated hrefs.
   */
  base?: string;

  /**
   * History implementation or shorthand mode. Use `memory` for tests and SSR.
   */
  history: History | RouterHistory;

  /**
   * Initial route records registered when the router is created.
   */
  routes: Readonly<RouteRecordRaw[]>;

  /**
   * Optional scroll handler called after successful navigations in the browser.
   */
  scrollBehavior?: RouterScrollBehavior;

  /**
   * Custom query parser. Receives the raw search string without the leading `?`.
   */
  parseQuery?: (search: string) => any;

  /**
   * Custom query stringifier. Must return a string without the leading `?`.
   */
  stringifyQuery?: (query: any) => string;

  /**
   * Class applied by RouterLink when the target route is active.
   */
  linkActiveClass?: string;

  /**
   * Class applied by RouterLink when the target route exactly matches.
   */
  linkExactActiveClass?: string;
}

export interface Router {
  /**
   * Reactive current route. It is updated only after a navigation is committed.
   */
  readonly currentRoute: Signal<RouteLocationNormalizedLoaded>;

  /**
   * Normalized router options passed to `createRouter`.
   */
  readonly options: RouterOptions;

  /**
   * Whether the router listens to history changes.
   */
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

  /**
   * Preloads async route components and route data hooks for a target location.
   */
  preloadRoute(to: RouteLocationRawTyped): Promise<RouteLocationNormalizedLoaded>;

  back(): ReturnType<Router['go']>;
  forward(): ReturnType<Router['go']>;
  go(delta: number): void;

  beforeEach(guard: NavigationGuardWithThis<undefined>): () => void;
  beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void;
  afterEach(guard: NavigationHookAfter): () => void;

  onError(handler: ErrorListener): () => void;
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
  const scrollPositionStore = createScrollPositionStore();

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
      (!isPush && scrollPositionStore.get(getScrollKey(from.fullPath, delta))) ||
      ((isFirstNavigation || !isPush) && history.state && (history.state as any).scroll) ||
      null;

    return Promise.resolve()
      .then(() => scrollBehavior(to, from, scrollPosition))
      .then((position) => position && scrollToPosition(position));
  };

  // --- Readiness controller (created first, shared by navigation & lifecycle) ---
  const readiness = createReadinessController(currentRoute);

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
    markAsReady: readiness.markAsReady,
    triggerError: readiness.triggerError,
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

    // Lifecycle
    onError: readiness.onError,
    isReady: readiness.isReady,
    init: (() => {}) as Router['init'],
    destroy: (() => {}) as Router['destroy'],

    // Prerender
    getPrerenderPaths: () => collectPrerenderPaths(matcher.getRoutes().map((r) => r.record)),
    getPrerenderPathsAsync: () =>
      collectPrerenderPathsAsync(matcher.getRoutes().map((r) => r.record)),
    getRouteRenderMode: (name: RouteRecordName): RouteRenderMode => {
      const record = matcher.getRecordMatcher(name)?.record;
      if (record?.start?.prerender) return 'prerender';
      if (record?.start?.ssr) return 'ssr';
      return 'csr';
    },
  } satisfies Router;

  // --- Wire up lifecycle ---
  const lifecycle = setupRouterLifecycle({
    router,
    currentRoute,
    routeLocationContext,
    readiness,
    resolve: (to: string) => resolver.resolve(to),
    setPendingLocation,
    pushWithRedirect: navigation.pushWithRedirect,
    navigate: runGuardPipeline,
    finalizeNavigation: navigation.finalizeNavigation,
    triggerAfterEach: pipeline.triggerAfterEach,
    handleRedirectRecord: navigation.handleRedirectRecord,
    clearCaches: navigation.clearCaches,
    routerHistory,
    scrollPositionStore,
  });

  router.init = () => lifecycle.init(router);
  router.destroy = lifecycle.destroy;

  registerActiveRouter(router);

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
