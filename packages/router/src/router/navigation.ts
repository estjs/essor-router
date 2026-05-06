import { nextTick, toRaw } from 'essor';
import {
  ErrorTypes,
  type NavigationFailure,
  type NavigationRedirectError,
  createRouterError,
  isNavigationFailure,
} from '../errors';
import { isSameRouteLocation } from '../location';
import { loadRouteLocation } from '../navigationGuards';
import { START_LOCATION_NORMALIZED } from '../types';
import { assign } from '../utils';
import { isBrowser } from '../utils/env';
import { warn } from '../warning';
import type {
  RouteLoaderContext,
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteLocationOptions,
  RouteLocationRaw,
  RouteParams,
} from '../types';
import type { HistoryState } from '../history/common';

export interface NavigationCoordinator {
  push: (to: RouteLocationRaw) => Promise<NavigationFailure | void | undefined>;
  replace: (to: RouteLocationRaw) => Promise<NavigationFailure | void | undefined>;
  preloadRoute: (to: RouteLocationRaw) => Promise<RouteLocationNormalizedLoaded>;
  clearCaches: () => void;
  checkCanceledNavigation: (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
  ) => NavigationFailure | void;
  checkCanceledNavigationAndReject: (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
  ) => Promise<void>;
  handleRedirectRecord: (to: RouteLocation) => RouteLocationRaw | void;
  finalizeNavigation: (
    toLocation: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    replace?: boolean,
    data?: HistoryState,
    delta?: number,
  ) => NavigationFailure | void;
  runRouteDataHooks: (to: RouteLocationNormalized, abortActive?: boolean) => Promise<void>;
}

interface CreateNavigationCoordinatorOptions {
  resolve: (
    to: Readonly<RouteLocationRaw>,
    currentLocation?: RouteLocationNormalizedLoaded,
  ) => RouteLocation & { href: string };
  locationAsObject: (to: RouteLocationRaw | RouteLocationNormalized) => any;
  stringifyQuery: (query: any) => string;
  currentRoute: { value: RouteLocationNormalizedLoaded };
  setPendingLocation: (location: RouteLocation) => void;
  getPendingLocation: () => RouteLocation;
  routerHistory: {
    push: (to: string, data?: HistoryState) => void;
    replace: (to: string, data?: HistoryState) => void;
  };
  triggerAfterEach: (
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void,
  ) => void;
  navigate: (to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded) => Promise<any>;
  markAsReady: <E extends Error = Error>(err?: E) => E | void;
  triggerError: (
    error: Error,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
  ) => Promise<unknown>;
  handleScroll: (
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    isFirstNavigation: boolean,
    delta?: number,
  ) => Promise<unknown>;
}

export function createNavigationCoordinator(
  options: CreateNavigationCoordinatorOptions,
): NavigationCoordinator {
  const preloadRouteCache = new Map<string, Promise<RouteLocationNormalizedLoaded>>();
  const routeDataCache = new Map<string, Promise<void>>();
  const routeDataControllers = new Map<string, AbortController>();
  const PRELOAD_CACHE_LIMIT = 32;
  const ROUTE_DATA_CACHE_LIMIT = 32;

  function touchCacheEntry<T>(cache: Map<string, T>, key: string) {
    const value = cache.get(key);
    if (value === undefined) return undefined;
    cache.delete(key);
    cache.set(key, value);
    return value;
  }

  function setCacheEntry<T>(cache: Map<string, T>, key: string, value: T, limit: number) {
    if (cache.has(key)) {
      cache.delete(key);
    }
    cache.set(key, value);
    while (cache.size > limit) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey == null) break;
      cache.delete(oldestKey);
    }
  }

  function abortActiveRouteDataHooks(exceptKey?: string) {
    routeDataControllers.forEach((controller, key) => {
      if (key === exceptKey) return;
      controller.abort();
      routeDataControllers.delete(key);
    });
  }

  function checkCanceledNavigation(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
  ): NavigationFailure | void {
    if (options.getPendingLocation() !== to) {
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

  function push(to: RouteLocationRaw) {
    return pushWithRedirect(to);
  }

  function replace(to: RouteLocationRaw) {
    return push(assign(options.locationAsObject(to), { replace: true }));
  }

  function handleRedirectRecord(to: RouteLocation): RouteLocationRaw | void {
    const lastMatched = to.matched.at(-1);
    if (!lastMatched || !lastMatched.redirect) return;

    const { redirect } = lastMatched;
    let newTargetLocation = typeof redirect === 'function' ? redirect(to) : redirect;

    if (typeof newTargetLocation === 'string') {
      const hasQueryOrHash = newTargetLocation.includes('?') || newTargetLocation.includes('#');
      newTargetLocation = hasQueryOrHash
        ? options.locationAsObject(newTargetLocation)
        : { path: newTargetLocation };
      // @ts-expect-error intentional reset
      newTargetLocation.params = {};
    }

    if (
      __DEV__ &&
      typeof newTargetLocation === 'object' &&
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
        params:
          typeof newTargetLocation === 'object' && newTargetLocation.path != null ? {} : to.params,
      },
      newTargetLocation,
    );
  }

  function pushWithRedirect(
    to: RouteLocationRaw | RouteLocation,
    redirectedFrom?: RouteLocation,
  ): Promise<NavigationFailure | void | undefined> {
    const targetLocation: RouteLocation = options.resolve(to as RouteLocationRaw);
    options.setPendingLocation(targetLocation);
    const from = options.currentRoute.value;
    const data: HistoryState | undefined = (to as RouteLocationOptions).state;
    const force: boolean | undefined = (to as RouteLocationOptions).force;
    const replace = (to as RouteLocationOptions).replace === true;

    const shouldRedirect = handleRedirectRecord(targetLocation);
    if (shouldRedirect) {
      return pushWithRedirect(
        assign(options.locationAsObject(shouldRedirect), {
          state: typeof shouldRedirect === 'object' ? assign({}, data, shouldRedirect.state) : data,
          force,
          replace,
        }),
        redirectedFrom || targetLocation,
      );
    }

    const toLocation = targetLocation as RouteLocationNormalized;
    toLocation.redirectedFrom = redirectedFrom;

    let failure: NavigationFailure | void | undefined;
    if (!force && isSameRouteLocation(options.stringifyQuery, toRaw(from), targetLocation)) {
      failure = createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_DUPLICATED, {
        to: toLocation,
        from,
      });
    }

    return (failure ? Promise.resolve(failure) : options.navigate(toLocation, from))
      .catch((error: NavigationFailure | NavigationRedirectError) => {
        return isNavigationFailure(error)
          ? isNavigationFailure(error, ErrorTypes.NAVIGATION_GUARD_REDIRECT)
            ? error
            : options.markAsReady(error)
          : options.triggerError(error, toLocation, from);
      })
      .then(async (failure: NavigationFailure | NavigationRedirectError | void) => {
        if (failure) {
          if (isNavigationFailure(failure, ErrorTypes.NAVIGATION_GUARD_REDIRECT)) {
            if (
              __DEV__ &&
              isSameRouteLocation(
                options.stringifyQuery,
                options.resolve(failure.to),
                toLocation,
              ) &&
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
                  replace,
                },
                options.locationAsObject(failure.to),
                {
                  state: typeof failure.to === 'object' ? assign({}, data, failure.to.state) : data,
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
            replace,
            data,
          );
          if (!failure) {
            await nextTick();
          }
        }

        options.triggerAfterEach(toLocation as RouteLocationNormalizedLoaded, from, failure as any);
        return failure;
      });
  }

  function createPreloadRouteKey(route: RouteLocationNormalized) {
    return route.fullPath;
  }

  async function runRouteDataHooks(
    to: RouteLocationNormalized,
    abortActive = false,
  ): Promise<void> {
    const key = createPreloadRouteKey(to);
    const cached = touchCacheEntry(routeDataCache, key);
    if (cached) {
      return cached;
    }

    if (abortActive) {
      abortActiveRouteDataHooks(key);
    }

    const search = to.query;
    const controller = new AbortController();
    routeDataControllers.set(key, controller);
    const task = (async () => {
      for (const record of to.matched) {
        const ctx: RouteLoaderContext = {
          params: to.params as RouteParams,
          search,
          signal: controller.signal,
        };
        if (record.beforeLoad) {
          await record.beforeLoad(ctx);
        }
        if (record.loader) {
          await record.loader(ctx);
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

    setCacheEntry(routeDataCache, key, task, ROUTE_DATA_CACHE_LIMIT);
    return task;
  }

  async function preloadRoute(to: RouteLocationRaw): Promise<RouteLocationNormalizedLoaded> {
    const resolved = options.resolve(to) as RouteLocationNormalized;
    const key = createPreloadRouteKey(resolved);
    const existing = touchCacheEntry(preloadRouteCache, key);
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

    setCacheEntry(preloadRouteCache, key, task, PRELOAD_CACHE_LIMIT);
    return task;
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
        options.routerHistory.replace(toLocation.fullPath, historyState);
      } else {
        options.routerHistory.push(toLocation.fullPath, historyState);
      }
    }

    options.currentRoute.value = toLocation;
    options.handleScroll(toLocation, from, isPush, isFirstNavigation, delta);
    options.markAsReady();
  }

  function clearCaches() {
    abortActiveRouteDataHooks();
    preloadRouteCache.clear();
    routeDataCache.clear();
  }

  return {
    push,
    replace,
    preloadRoute,
    clearCaches,
    checkCanceledNavigation,
    checkCanceledNavigationAndReject,
    handleRedirectRecord,
    finalizeNavigation,
    runRouteDataHooks,
  };
}
