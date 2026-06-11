import { nextTick, toRaw } from 'essor';
import { isFunction, isObject, isString } from '@estjs/shared';
import {
  ErrorTypes,
  type NavigationFailure,
  type NavigationRedirectError,
  createRouterError,
  isNavigationFailure,
} from '../core/errors';
import { isSameRouteLocation, parseURL, stringifyURL } from '../core/location';
import {
  type LocationQuery,
  type LocationQueryRaw,
  type parseQuery as defaultParseQuery,
  stringifyQuery as defaultStringifyQuery,
  normalizeQuery,
} from '../core/query';
import {
  type Lazy,
  type MatcherLocation,
  type MatcherLocationRaw,
  type NavigationGuardWithThis,
  type NavigationHookAfter,
  type RouteLoaderContext,
  type RouteLocation,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  type RouteLocationOptions,
  type RouteLocationRaw,
  type RouteParams,
  START_LOCATION_NORMALIZED,
  isRouteLocation,
} from '../types';
import { applyToParams, assign, isBrowser, isArray } from '../utils';
import { LRUCache } from '../utils/lru';
import { useCallbacks } from '../utils/callbacks';
import { warn } from '../core/warning';
import { decode, encodeHash, encodeParam } from '../encoding';
import { extractComponentsGuards, guardToPromiseFn, loadRouteLocation } from './guards';
import { createRouteAccessor } from '../core/useApi';
import type { Signal } from 'essor';
import type { HistoryState, RouterHistory } from '../history/common';
import type { RouteRecordNormalized } from '../matcher/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ErrorListener {
  (error: Error, to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded): void;
}

export interface MatcherResolver {
  resolve(
    location: MatcherLocationRaw & { query?: LocationQueryRaw },
    currentLocation: MatcherLocation,
  ): MatcherLocation;
}

export interface NavigatorOptions {
  matcher: MatcherResolver;
  routerHistory: RouterHistory;
  currentRoute: Signal<RouteLocationNormalizedLoaded>;
  parseQuery: typeof defaultParseQuery;
  stringifyQuery: typeof defaultStringifyQuery;
  handleScroll: (
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    isFirstNavigation: boolean,
    delta?: number,
  ) => Promise<unknown>;
}

export interface Navigator {
  // Resolution
  resolve: (
    rawLocation: Readonly<RouteLocationRaw>,
    currentLocation?: RouteLocationNormalizedLoaded,
  ) => RouteLocation & { href: string };
  locationAsObject: (
    to: RouteLocationRaw | RouteLocationNormalized,
  ) => Exclude<RouteLocationRaw, string> | RouteLocationNormalized;

  // Navigation
  push: (to: RouteLocationRaw) => Promise<NavigationFailure | void | undefined>;
  pushWithRedirect: (
    to: RouteLocationRaw | RouteLocation,
    redirectedFrom?: RouteLocation,
  ) => Promise<NavigationFailure | void | undefined>;
  replace: (to: RouteLocationRaw) => Promise<NavigationFailure | void | undefined>;
  preloadRoute: (to: RouteLocationRaw) => Promise<RouteLocationNormalizedLoaded>;
  finalizeNavigation: (
    toLocation: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    replace?: boolean,
    data?: HistoryState,
    delta?: number,
  ) => NavigationFailure | void;
  handleRedirectRecord: (to: RouteLocation) => RouteLocationRaw | void;
  runRouteDataHooks: (to: RouteLocationNormalized, abortActive?: boolean) => Promise<void>;
  checkCanceledNavigationAndReject: (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
  ) => Promise<void>;
  setPendingLocation: (location: RouteLocation) => void;
  runGuardPipeline: (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
  ) => Promise<any>;
  clearCaches: () => void;

  // Guards
  beforeGuards: ReturnType<typeof useCallbacks<NavigationGuardWithThis<undefined>>>;
  beforeResolveGuards: ReturnType<typeof useCallbacks<NavigationGuardWithThis<undefined>>>;
  afterGuards: ReturnType<typeof useCallbacks<NavigationHookAfter>>;
  triggerAfterEach: (
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void,
  ) => void;

  // Readiness
  ready: boolean;
  markAsReady: <E extends Error = Error>(err?: E) => E | void;
  triggerError: (
    error: Error,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
  ) => Promise<unknown>;
  isReady: () => Promise<void>;
  onError: (handler: ErrorListener) => () => void;
  setReady: (value: boolean) => void;
  onFirstReady: (fn: () => void) => void;
}

// ---------------------------------------------------------------------------
// Reactive route helper
// ---------------------------------------------------------------------------

export function createReactiveRoute(
  currentRoute: Signal<RouteLocationNormalizedLoaded>,
): RouteLocationNormalizedLoaded {
  return createRouteAccessor(currentRoute);
}

// ---------------------------------------------------------------------------
// Navigator factory
// ---------------------------------------------------------------------------

export function createNavigator(options: NavigatorOptions): Navigator {
  const { routerHistory, currentRoute, parseQuery, stringifyQuery } = options;

  // ===== Route resolution =====

  const normalizeParams = applyToParams.bind(null, (paramValue) => `${paramValue}`);
  const encodeParams = applyToParams.bind(null, encodeParam);
  const decodeParams: (params: RouteParams | undefined) => RouteParams =
    // @ts-expect-error intentional runtime conversion
    applyToParams.bind(null, decode);

  function resolve(
    rawLocation: Readonly<RouteLocationRaw>,
    currentLocation?: RouteLocationNormalizedLoaded,
  ): RouteLocation & { href: string } {
    currentLocation = assign({}, currentLocation || currentRoute.value);

    if (isString(rawLocation)) {
      const locationNormalized = parseURL(parseQuery, rawLocation, currentLocation.path);
      const matchedRoute = options.matcher.resolve(
        { path: locationNormalized.path, query: locationNormalized.query },
        currentLocation,
      );
      const href = routerHistory.createHref(locationNormalized.fullPath);

      if (__DEV__) {
        if (href.startsWith('//')) {
          warn(
            `Location "${rawLocation}" resolved to "${href}".A resolved location cannot start with multiple slashes.`,
          );
        } else if (matchedRoute.matched.length === 0) {
          warn(`No match found for location with path "${rawLocation}"`);
        }
      }

      return assign(locationNormalized, matchedRoute, {
        params: decodeParams(matchedRoute.params),
        hash: decode(locationNormalized.hash),
        redirectedFrom: undefined,
        href,
      });
    }

    if (__DEV__ && !isRouteLocation(rawLocation)) {
      warn(
        'router.resolve() was passed an invalid location.This will fail in production.\n - Location: ',
        rawLocation,
      );
      rawLocation = {};
    }

    let matcherLocation: MatcherLocationRaw;
    if (rawLocation.path != null) {
      if (
        __DEV__ &&
        'params' in rawLocation &&
        !('name' in rawLocation) &&
        // @ts-expect-error branch relies on runtime object input
        Object.keys(rawLocation.params).length > 0
      ) {
        warn(
          `Path "${rawLocation.path}" was passed with params but they will be ignored.Use a named route alongside params instead.`,
        );
      }
      matcherLocation = assign({}, rawLocation, {
        path: parseURL(parseQuery, rawLocation.path, currentLocation.path).path,
      });
    } else {
      const targetParams = assign({}, rawLocation.params);
      for (const key in targetParams) {
        if (targetParams[key] == null) {
          delete targetParams[key];
        }
      }
      matcherLocation = assign({}, rawLocation, {
        params: encodeParams(targetParams),
      });
      currentLocation.params = encodeParams(currentLocation.params);
    }

    const matchedRoute = options.matcher.resolve(matcherLocation, currentLocation);
    const hash = rawLocation.hash || '';

    if (__DEV__ && hash && !hash.startsWith('#')) {
      warn(
        `A \`hash\` should always start with the character "#". Replace "${hash}" with "#${hash}".`,
      );
    }

    matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
    const fullPath = stringifyURL(
      stringifyQuery,
      assign({}, rawLocation, {
        hash: encodeHash(hash),
        path: matchedRoute.path,
      }),
    );

    const href = routerHistory.createHref(fullPath);

    if (__DEV__) {
      if (href.startsWith('//')) {
        warn(
          `Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`,
        );
      } else if (matchedRoute.matched.length === 0) {
        warn(
          `No match found for location with path "${rawLocation.path != null ? rawLocation.path : rawLocation}"`,
        );
      }
    }

    return assign(
      {
        fullPath,
        hash,
        query:
          stringifyQuery === defaultStringifyQuery
            ? normalizeQuery(rawLocation.query)
            : ((rawLocation.query || {}) as LocationQuery),
      },
      matchedRoute,
      {
        redirectedFrom: undefined,
        href,
      },
    );
  }

  function locationAsObject(
    to: RouteLocationRaw | RouteLocationNormalized,
  ): Exclude<RouteLocationRaw, string> | RouteLocationNormalized {
    return isString(to) ? parseURL(parseQuery, to, currentRoute.value.path) : assign({}, to);
  }

  // ===== Guard pipeline =====

  const beforeGuards = useCallbacks<NavigationGuardWithThis<undefined>>();
  const beforeResolveGuards = useCallbacks<NavigationGuardWithThis<undefined>>();
  const afterGuards = useCallbacks<NavigationHookAfter>();

  function triggerAfterEach(
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void,
  ) {
    afterGuards.list().forEach((guard) => guard(to, from, failure));
  }

  function runGuardPipeline(
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
  ): Promise<any> {
    const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
    const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);

    // Phase 1: Leaving component guards + leaveGuards + beforeLeave
    const guards = extractComponentsGuards(leavingRecords.reverse(), 'beforeLeave', to, from);
    for (const record of leavingRecords) {
      record.leaveGuards?.forEach((guard) => {
        guards.push(guardToPromiseFn(guard, to, from));
      });
      if (record.beforeLeave && Object.values(record.instances).some((instance) => !!instance)) {
        if (isArray(record.beforeLeave)) {
          for (const guard of record.beforeLeave) {
            guards.push(guardToPromiseFn(guard, to, from));
          }
        } else {
          guards.push(guardToPromiseFn(record.beforeLeave, to, from));
        }
      }
    }

    const phases: Array<() => Lazy<any>[]> = [
      // Phase 1: leaving guards (already collected above)
      () => guards,
      // Phase 2: Global beforeEach guards
      () => beforeGuards.list().map((guard) => guardToPromiseFn(guard, to, from)),
      // Phase 3: Updating component guards + updateGuards
      () => {
        const g = extractComponentsGuards(updatingRecords, 'beforeRouteUpdate', to, from);
        for (const record of updatingRecords) {
          record.updateGuards?.forEach((guard) => {
            g.push(guardToPromiseFn(guard, to, from));
          });
        }
        return g;
      },
      // Phase 4: Entering route beforeEnter guards
      () => {
        const g: Lazy<any>[] = [];
        for (const record of enteringRecords) {
          if (record.beforeEnter) {
            if (isArray(record.beforeEnter)) {
              for (const beforeEnter of record.beforeEnter) {
                g.push(guardToPromiseFn(beforeEnter, to, from));
              }
            } else {
              g.push(guardToPromiseFn(record.beforeEnter, to, from));
            }
          }
        }
        return g;
      },
      // Phase 5: Entering component beforeRouteEnter guards
      () => {
        to.matched.forEach((record) => (record.enterCallbacks = {}));
        return extractComponentsGuards(enteringRecords, 'beforeRouteEnter', to, from);
      },
      // Phase 6: Global beforeResolve guards
      () => beforeResolveGuards.list().map((guard) => guardToPromiseFn(guard, to, from)),
    ];

    let promise: Promise<void> = Promise.resolve();
    for (const collectGuards of phases) {
      promise = promise.then(async () => {
        const phaseGuards = collectGuards();
        phaseGuards.push(canceledNavigationCheck);
        await runGuardQueue(phaseGuards);
      });
    }

    return promise
      .then(() => runRouteDataHooks(to, true))
      .catch((error) =>
        isNavigationFailure(error, ErrorTypes.NAVIGATION_CANCELLED) ? error : Promise.reject(error),
      );
  }

  // ===== Readiness =====

  type OnReadyCallback = [() => void, (reason?: Error) => void];
  const readyHandlers = useCallbacks<OnReadyCallback>();
  const errorListeners = useCallbacks<ErrorListener>();
  let ready = false;
  let firstReadyCallback: (() => void) | null = null;

  function markAsReady<E extends Error = Error>(err?: E): E | void {
    if (!ready) {
      ready = !err;
      readyHandlers.list().forEach(([resolve, reject]) => (err ? reject(err) : resolve()));
      readyHandlers.reset();
      if (!err && firstReadyCallback) {
        firstReadyCallback();
        firstReadyCallback = null;
      }
    }
    return err;
  }

  function triggerError(
    error: Error,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
  ): Promise<unknown> {
    markAsReady(error);
    const list = errorListeners.list();
    if (list.length > 0) {
      list.forEach((handler) => handler(error, to, from));
    } else if (__DEV__) {
      warn('uncaught error during route navigation:');
    }
    return Promise.reject(error);
  }

  function isReady(): Promise<void> {
    if (ready && currentRoute.value !== START_LOCATION_NORMALIZED) return Promise.resolve();
    return new Promise((resolve, reject) => {
      readyHandlers.add([resolve, reject]);
    });
  }

  function setReady(value: boolean) {
    ready = value;
  }

  function onFirstReady(fn: () => void) {
    if (ready) {
      fn();
    } else {
      firstReadyCallback = fn;
    }
  }

  // ===== Navigation coordination =====

  const preloadRouteCache = new LRUCache<string, Promise<RouteLocationNormalizedLoaded>>(32);
  const routeDataCache = new LRUCache<string, Promise<void>>(32);
  const routeDataControllers = new Map<string, AbortController>();
  let pendingLocation: RouteLocation = START_LOCATION_NORMALIZED;

  function setPendingLocation(location: RouteLocation) {
    pendingLocation = location;
  }

  function abortActiveRouteDataHooks(exceptKey?: string) {
    for (const [key, controller] of routeDataControllers) {
      if (key === exceptKey) continue;
      controller.abort();
      routeDataControllers.delete(key);
    }
  }

  function checkCanceledNavigation(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
  ): NavigationFailure | void {
    if (pendingLocation !== to) {
      return createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_CANCELLED, {
        from,
        to,
      });
    }
  }

  function checkCanceledNavigationAndReject(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
  ): Promise<void> {
    const error = checkCanceledNavigation(to, from);
    return error ? Promise.reject(error) : Promise.resolve();
  }

  // ===== Push / Replace / Finalize =====

  function push(to: RouteLocationRaw) {
    return pushWithRedirect(to);
  }

  function replace(to: RouteLocationRaw) {
    return pushWithRedirect(assign(locationAsObject(to), { replace: true }));
  }

  function handleRedirectRecord(to: RouteLocation): RouteLocationRaw | void {
    const lastMatched = to.matched.at(-1);
    if (!lastMatched || !lastMatched.redirect) return;

    const { redirect } = lastMatched;
    let newTargetLocation = isFunction(redirect) ? redirect(to) : redirect;

    if (isString(newTargetLocation)) {
      const hasQueryOrHash = newTargetLocation.includes('?') || newTargetLocation.includes('#');
      newTargetLocation = hasQueryOrHash
        ? locationAsObject(newTargetLocation)
        : { path: newTargetLocation };
      // @ts-expect-error intentional reset
      newTargetLocation.params = {};
    }

    if (
      __DEV__ &&
      isObject(newTargetLocation) &&
      newTargetLocation.path == null &&
      !('name' in newTargetLocation)
    ) {
      warn(
        `Invalid redirect found:\n${JSON.stringify(
          newTargetLocation,
          null,
          2,
        )}\n when navigating to "${to.fullPath}". A redirect must contain a name or path. This will break in production.`,
      );
      throw new Error('Invalid redirect');
    }

    return assign(
      {
        query: to.query,
        hash: to.hash,
        params: isObject(newTargetLocation) && newTargetLocation.path != null ? {} : to.params,
      },
      newTargetLocation,
    );
  }

  function pushWithRedirect(
    to: RouteLocationRaw | RouteLocation,
    redirectedFrom?: RouteLocation,
  ): Promise<NavigationFailure | void | undefined> {
    const targetLocation: RouteLocation = resolve(to as RouteLocationRaw);
    pendingLocation = targetLocation;
    const from = currentRoute.value;
    const data: HistoryState | undefined = (to as RouteLocationOptions).state;
    const force: boolean | undefined = (to as RouteLocationOptions).force;
    const replaceOpt = (to as RouteLocationOptions).replace === true;

    const shouldRedirect = handleRedirectRecord(targetLocation);
    if (shouldRedirect) {
      return pushWithRedirect(
        assign(locationAsObject(shouldRedirect), {
          state: isObject(shouldRedirect) ? assign({}, data, shouldRedirect.state) : data,
          force,
          replace: replaceOpt,
        }),
        redirectedFrom || targetLocation,
      );
    }

    const toLocation = targetLocation as RouteLocationNormalized;
    toLocation.redirectedFrom = redirectedFrom;

    let failure: NavigationFailure | void | undefined;
    if (!force && isSameRouteLocation(stringifyQuery, toRaw(from), targetLocation)) {
      failure = createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_DUPLICATED, {
        to: toLocation,
        from,
      });
    }

    return (failure ? Promise.resolve(failure) : runGuardPipeline(toLocation, from))
      .catch((error: NavigationFailure | NavigationRedirectError) => {
        return isNavigationFailure(error)
          ? isNavigationFailure(error, ErrorTypes.NAVIGATION_GUARD_REDIRECT)
            ? error
            : markAsReady(error)
          : triggerError(error, toLocation, from);
      })
      .then(async (failure: NavigationFailure | NavigationRedirectError | void) => {
        if (failure) {
          if (isNavigationFailure(failure, ErrorTypes.NAVIGATION_GUARD_REDIRECT)) {
            if (
              __DEV__ &&
              isSameRouteLocation(stringifyQuery, resolve(failure.to), toLocation) &&
              redirectedFrom &&
              // @ts-expect-error dev counter only
              (redirectedFrom._count = redirectedFrom._count ? redirectedFrom._count + 1 : 1) > 30
            ) {
              warn(
                `Detected a possibly infinite redirection in a navigation guard when going from "${from.fullPath}" to "${toLocation.fullPath}". Aborting to avoid a Stack Overflow.`,
              );
              return Promise.reject(new Error('Infinite redirect in navigation guard'));
            }

            return pushWithRedirect(
              assign(
                {
                  replace: replaceOpt,
                },
                locationAsObject(failure.to),
                {
                  state: isObject(failure.to) ? assign({}, data, failure.to.state) : data,
                  force,
                },
              ),
              redirectedFrom || toLocation,
            );
          }
        } else {
          failure = finalizeNavigation(
            toLocation as RouteLocationNormalizedLoaded,
            from,
            true,
            replaceOpt,
            data,
          );
          if (!failure) {
            await nextTick();
          }
        }

        triggerAfterEach(toLocation as RouteLocationNormalizedLoaded, from, failure);
        return failure;
      });
  }

  function finalizeNavigation(
    toLocation: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    replace?: boolean,
    data?: HistoryState,
    delta = 0,
  ): NavigationFailure | void {
    const error = checkCanceledNavigation(toLocation, from);
    if (error) return error;

    const isFirstNavigation = from === START_LOCATION_NORMALIZED;
    const state: Partial<HistoryState> | null = !isBrowser ? {} : history.state;

    if (isPush) {
      const shouldReplace = replace || isFirstNavigation;
      const historyState = shouldReplace
        ? assign({ scroll: isFirstNavigation && state && state.scroll }, data)
        : data;

      if (shouldReplace) {
        routerHistory.replace(toLocation.fullPath, historyState);
      } else {
        routerHistory.push(toLocation.fullPath, historyState);
      }
    }

    currentRoute.value = toLocation;
    options.handleScroll(toLocation, from, isPush, isFirstNavigation, delta);
    markAsReady();
  }

  // ===== Route data hooks =====

  function runRouteDataHooks(to: RouteLocationNormalized, abortActive = false): Promise<void> {
    const key = to.fullPath;
    const cached = routeDataCache.get(key);
    if (cached) {
      return cached;
    }

    if (abortActive) {
      abortActiveRouteDataHooks(key);
    }

    const search = to.query;
    const controller = new AbortController();
    routeDataControllers.set(key, controller);
    const checkCancelled = () => {
      if (controller.signal.aborted) {
        throw createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_CANCELLED, {
          from: currentRoute.value,
          to,
        });
      }
    };
    const task = (async () => {
      for (const record of to.matched) {
        const ctx: RouteLoaderContext = {
          params: to.params as RouteParams,
          route: to,
          search,
          signal: controller.signal,
        };
        checkCancelled();
        if (record.beforeLoad) {
          await record.beforeLoad(ctx);
          checkCancelled();
        }
        if (record.loader) {
          await record.loader(ctx);
          checkCancelled();
        }
      }
    })()
      .catch((error) => {
        routeDataCache.delete(key);
        throw error;
      })
      .finally(() => {
        if (routeDataControllers.get(key) === controller) {
          routeDataControllers.delete(key);
        }
      });

    routeDataCache.set(key, task);
    return task;
  }

  function preloadRoute(to: RouteLocationRaw): Promise<RouteLocationNormalizedLoaded> {
    const resolved = resolve(to) as RouteLocationNormalized;
    const key = resolved.fullPath;
    const existing = preloadRouteCache.get(key);
    if (existing) {
      return existing;
    }

    const task = loadRouteLocation(resolved)
      .then(async (loaded) => {
        await runRouteDataHooks(loaded);
        return loaded;
      })
      .catch((error) => {
        preloadRouteCache.delete(key);
        throw error;
      });

    preloadRouteCache.set(key, task);
    return task;
  }

  function clearCaches() {
    abortActiveRouteDataHooks();
    preloadRouteCache.clear();
    routeDataCache.clear();
  }

  // ===== Public API =====

  return {
    // Resolution
    resolve,
    locationAsObject,

    // Navigation
    push,
    pushWithRedirect,
    replace,
    preloadRoute,
    finalizeNavigation,
    handleRedirectRecord,
    runRouteDataHooks,
    checkCanceledNavigationAndReject,
    setPendingLocation,
    runGuardPipeline,
    clearCaches,

    // Guards
    beforeGuards,
    beforeResolveGuards,
    afterGuards,
    triggerAfterEach,

    // Readiness
    get ready() {
      return ready;
    },
    markAsReady,
    triggerError,
    isReady,
    onError: errorListeners.add,
    setReady,
    onFirstReady,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function runGuardQueue(guards: Lazy<any>[]): Promise<void> {
  return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve());
}

function extractChangingRecords(to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded) {
  const leavingRecords: RouteRecordNormalized[] = [];
  const updatingRecords: RouteRecordNormalized[] = [];
  const enteringRecords: RouteRecordNormalized[] = [];

  // Build identity Sets for O(1) lookups instead of O(n) .some() calls
  const toRawRecords = new Set(to.matched.map((r) => toRaw(r).aliasOf || toRaw(r)));
  const fromRawRecords = new Set(from.matched.map((r) => toRaw(r).aliasOf || toRaw(r)));

  for (const recordFrom of from.matched) {
    const rawFrom = toRaw(recordFrom).aliasOf || toRaw(recordFrom);
    if (toRawRecords.has(rawFrom)) {
      updatingRecords.push(recordFrom);
    } else {
      leavingRecords.push(recordFrom);
    }
  }

  for (const recordTo of to.matched) {
    const rawTo = toRaw(recordTo).aliasOf || toRaw(recordTo);
    if (!fromRawRecords.has(rawTo)) {
      enteringRecords.push(recordTo);
    }
  }

  return [leavingRecords, updatingRecords, enteringRecords];
}
