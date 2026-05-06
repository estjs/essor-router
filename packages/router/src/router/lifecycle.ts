import { nextTick, provide, toRaw } from 'essor';
import { routerKey, routerViewLocationKey } from '@/injectionSymbols';
import {
  ErrorTypes,
  type NavigationFailure,
  type NavigationRedirectError,
  isNavigationFailure,
} from '../errors';
import { NavigationType, type RouterHistory } from '../history/common';
import { START_LOCATION_NORMALIZED } from '../types';
import { noop } from '../utils';
import { useCallbacks } from '../utils/callbacks';
import { isBrowser } from '../utils/env';
import { warn } from '../warning';
import { computeScrollPosition, getScrollKey, saveScrollPosition } from '../scrollBehavior';
import type {
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from '../types';

export interface ErrorListener {
  (error: Error, to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded): void;
}

type OnReadyCallback = [() => void, (reason?: Error) => void];

interface LifecycleOptions {
  router: { listening: boolean };
  currentRoute: { value: RouteLocationNormalizedLoaded };
  resolve: (to: string) => RouteLocation;
  setPendingLocation: (location: RouteLocation) => void;
  pushWithRedirect: (
    to: any,
    redirectedFrom?: RouteLocation,
  ) => Promise<NavigationFailure | void | undefined>;
  navigate: (to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded) => Promise<any>;
  finalizeNavigation: (
    toLocation: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    isPush: boolean,
    replace?: boolean,
    data?: any,
    delta?: number,
  ) => NavigationFailure | void;
  triggerAfterEach: (
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void,
  ) => void;
  handleRedirectRecord: (to: RouteLocation) => any;
  clearCaches: () => void;
  routerHistory: RouterHistory;
}

export function setupRouterLifecycle(options: LifecycleOptions) {
  const readyHandlers = useCallbacks<OnReadyCallback>();
  const errorListeners = useCallbacks<ErrorListener>();

  let ready = false;
  let started: boolean | undefined;
  let activeViewCount = 0;
  let removeHistoryListener: undefined | null | (() => void);

  function setupListeners() {
    if (removeHistoryListener) return;

    removeHistoryListener = options.routerHistory.listen((to, _from, info) => {
      if (!options.router.listening) return;

      const toLocation = options.resolve(to) as RouteLocationNormalized;
      const shouldRedirect = options.handleRedirectRecord(toLocation);
      if (shouldRedirect) {
        options
          .pushWithRedirect(Object.assign({}, shouldRedirect, { replace: true }), toLocation)
          .catch(noop);
        return;
      }

      options.setPendingLocation(toLocation);
      const from = options.currentRoute.value;
      if (isBrowser) {
        saveScrollPosition(getScrollKey(from.fullPath, info.delta), computeScrollPosition());
      }

      options
        .navigate(toLocation, from)
        .catch((error: NavigationFailure | NavigationRedirectError) => {
          if (
            isNavigationFailure(
              error,
              ErrorTypes.NAVIGATION_ABORTED | ErrorTypes.NAVIGATION_CANCELLED,
            )
          ) {
            return error;
          }

          if (isNavigationFailure(error, ErrorTypes.NAVIGATION_GUARD_REDIRECT)) {
            options
              .pushWithRedirect((error as NavigationRedirectError).to, toLocation)
              .then((failure) => {
                if (
                  isNavigationFailure(
                    failure,
                    ErrorTypes.NAVIGATION_ABORTED | ErrorTypes.NAVIGATION_DUPLICATED,
                  ) &&
                  !info.delta &&
                  info.type === NavigationType.pop
                ) {
                  options.routerHistory.go(-1, false);
                }
              })
              .catch(noop);
            return Promise.reject();
          }

          if (info.delta) {
            options.routerHistory.go(-info.delta, false);
          }
          return triggerError(error, toLocation, from);
        })
        .then(async (failure: NavigationFailure | void) => {
          failure =
            failure ||
            options.finalizeNavigation(
              toLocation as RouteLocationNormalizedLoaded,
              from,
              false,
              false,
              undefined,
              info.delta,
            );

          if (!failure) {
            await nextTick();
          }

          if (failure) {
            if (info.delta && !isNavigationFailure(failure, ErrorTypes.NAVIGATION_CANCELLED)) {
              options.routerHistory.go(-info.delta, false);
            } else if (
              info.type === NavigationType.pop &&
              isNavigationFailure(
                failure,
                ErrorTypes.NAVIGATION_ABORTED | ErrorTypes.NAVIGATION_DUPLICATED,
              )
            ) {
              options.routerHistory.go(-1, false);
            }
          }

          options.triggerAfterEach(toLocation as RouteLocationNormalizedLoaded, from, failure);
        })
        .catch(noop);
    });
  }

  function markAsReady<E extends Error = Error>(err: E): E;
  function markAsReady<E extends Error = Error>(): void;
  function markAsReady<E extends Error = Error>(err?: E): E | void {
    if (!ready) {
      ready = !err;
      setupListeners();
      readyHandlers.list().forEach(([resolve, reject]) => (err ? reject(err) : resolve()));
      readyHandlers.reset();
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
    if (ready && options.currentRoute.value !== START_LOCATION_NORMALIZED) return Promise.resolve();
    return new Promise((resolve, reject) => {
      readyHandlers.add([resolve, reject]);
    });
  }

  function init(routerInstance: any) {
    activeViewCount++;
    const shouldPerformInitialNavigation =
      isBrowser && !started && toRaw(options.currentRoute.value) === START_LOCATION_NORMALIZED;

    if (shouldPerformInitialNavigation) {
      started = true;
      options.pushWithRedirect(options.routerHistory.location).catch((error) => {
        if (__DEV__) warn('Unexpected error when starting the router:', error);
      });
    }
    provide(routerKey, routerInstance);
    provide(routerViewLocationKey, options.currentRoute);
  }

  function destroy() {
    if (activeViewCount > 0) {
      activeViewCount--;
    }
    if (activeViewCount > 0) {
      return;
    }

    options.setPendingLocation(START_LOCATION_NORMALIZED);

    if (removeHistoryListener) {
      removeHistoryListener();
      removeHistoryListener = null;
    }

    try {
      options.currentRoute.value = START_LOCATION_NORMALIZED;
    } catch (error) {
      if (__DEV__) {
        warn('Failed to reset current route during destroy:', error);
      }
    }
    options.clearCaches();
    started = false;
    ready = false;
  }

  return {
    init,
    destroy,
    isReady,
    markAsReady,
    triggerError,
    onError: errorListeners.add,
  };
}
