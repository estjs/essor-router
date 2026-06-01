import { nextTick, provide, toRaw } from 'essor';
import { routeLocationKey, routerKey, routerViewLocationKey } from '../core/injectionSymbols';
import {
  ErrorTypes,
  type NavigationFailure,
  type NavigationRedirectError,
  isNavigationFailure,
} from '../core/errors';
import { NavigationType, type RouterHistory } from '../history/common';
import { START_LOCATION_NORMALIZED } from '../types';
import { noop } from '../utils';
import { isBrowser } from '../utils/env';
import { warn } from '../core/warning';
import { unregisterActiveRouter } from '../core/useApi';
import {
  type ScrollPositionStore,
  computeScrollPosition,
  getScrollKey,
} from '../core/scrollBehavior';
import type { Router } from '../core/router';
import type { ReadinessController } from './readiness';
import type {
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
} from '../types';

export type { ErrorListener } from './readiness';

interface LifecycleOptions {
  router: { listening: boolean };
  currentRoute: { value: RouteLocationNormalizedLoaded };
  routeLocationContext: RouteLocationNormalizedLoaded;
  readiness: ReadinessController;
  resolve: (to: string) => RouteLocation;
  setPendingLocation: (location: RouteLocation) => void;
  pushWithRedirect: (
    to: RouteLocationRaw | RouteLocation,
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
  scrollPositionStore: ScrollPositionStore;
}

export function setupRouterLifecycle(options: LifecycleOptions) {
  let started: boolean | undefined;
  let activeViewCount = 0;
  let removeHistoryListener: undefined | null | (() => void);

  function setupHistoryListener() {
    if (removeHistoryListener) return;

    removeHistoryListener = options.routerHistory.listen((to, _from, info) => {
      if (!options.router.listening) return;

      const toLocation = options.resolve(to) as RouteLocationNormalized;
      const shouldRedirect = options.handleRedirectRecord(toLocation);
      if (shouldRedirect) {
        // Save the scroll position of the page we are leaving before bailing
        // out to the redirect. Without this, a pop that lands on a redirecting
        // record loses the scroll position for the origin entry.
        if (isBrowser) {
          options.scrollPositionStore.save(
            getScrollKey(options.currentRoute.value.fullPath, info.delta),
            computeScrollPosition(),
          );
        }
        options
          .pushWithRedirect(Object.assign({}, shouldRedirect, { replace: true }), toLocation)
          .catch(noop);
        return;
      }

      options.setPendingLocation(toLocation);
      const from = options.currentRoute.value;
      if (isBrowser) {
        options.scrollPositionStore.save(
          getScrollKey(from.fullPath, info.delta),
          computeScrollPosition(),
        );
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
          return options.readiness.triggerError(error, toLocation, from);
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

  function init(routerInstance: any) {
    activeViewCount++;
    if (activeViewCount > 1) return;

    const shouldPerformInitialNavigation =
      isBrowser && !started && toRaw(options.currentRoute.value) === START_LOCATION_NORMALIZED;

    if (shouldPerformInitialNavigation) {
      started = true;
      options.pushWithRedirect(options.routerHistory.location).catch((error) => {
        if (__DEV__) warn('Unexpected error when starting the router:', error);
      });
    }
    provide(routerKey, routerInstance);
    provide(routeLocationKey, options.routeLocationContext);
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
    options.scrollPositionStore.clear();
    started = false;
    options.readiness.setReady(false);
    // Re-arm the history listener for a potential re-init (the router is
    // reusable: `started` is reset above). `onFirstReady` is one-shot and was
    // already consumed on the first ready, so without this a remounted
    // RouterView would never react to browser back/forward again.
    options.readiness.onFirstReady(setupHistoryListener);
    unregisterActiveRouter(options.router as unknown as Router);
  }

  options.readiness.onFirstReady(setupHistoryListener);

  return {
    init,
    destroy,
  };
}
