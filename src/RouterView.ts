import { type Signal, computed, createComponent, inject, onDestroy, provide, signal } from 'essor';
import {
  matchedRouteKey,
  routeLocationKey,
  routerKey,
  routerViewLocationKey,
  viewDepthKey,
} from './injectionSymbols';
import {
  type RouteComponent,
  type RouteLocationNormalized,
  START_LOCATION_NORMALIZED,
} from './types';
import type { Router } from './router';

// Define specific types for RouterView children
export type RouterViewChildren =
  | string
  | number
  | (() => string | number | HTMLElement | RouteComponent | null)
  | HTMLElement
  | RouteComponent
  | null
  | undefined;

// Enhanced RouterView props with better type safety
export interface RouterViewProps {
  name?: string;
  route?: RouteLocationNormalized;
  children?: RouterViewChildren;
  router?: Router; // Made optional to support injection
  fallback?: RouteComponent; // Fallback component for loading/error states
  onError?: (error: Error) => void; // Error handling callback
}

export const RouterView = (props: RouterViewProps) => {
  // Try to get router from props first, then from injection
  let router = props.router;
  if (!router) {
    router = inject(routerKey);
  }

  // Validate router existence before proceeding
  if (!router) {
    throw new Error(
      'RouterView requires a router instance. ' +
        'Please provide a router via props or ensure RouterView is used within a router context. ' +
        'Make sure you have created a router instance and passed it to RouterView, or that a parent component provides the router through injection.',
    );
  }

  router.init()

  onDestroy(()=>{
    router.destroy()
  })
  // Provide router and route for useRouter/useRoute hooks
  provide(routerKey, router);

  // Create reactive route object for useRoute hook with proper typing
  const reactiveRoute = {} as RouteLocationNormalized;
  for (const key in START_LOCATION_NORMALIZED) {
    Object.defineProperty(reactiveRoute, key, {
      get: () => {
        // Safe access to router.currentRoute with null checks
        if (!router || !router.currentRoute) {
          return START_LOCATION_NORMALIZED[key as keyof RouteLocationNormalized];
        }

        // Properly access the signal value
        const currentRoute = router.currentRoute.value;
        if (!currentRoute || typeof currentRoute !== 'object') {
          return START_LOCATION_NORMALIZED[key as keyof RouteLocationNormalized];
        }

        return (
          currentRoute[key as keyof RouteLocationNormalized] ??
          START_LOCATION_NORMALIZED[key as keyof RouteLocationNormalized]
        );
      },
      enumerable: true,
    });
  }
  provide(routeLocationKey, reactiveRoute);

  const injectedRoute = inject(routerViewLocationKey) || (router ? router.currentRoute : null);
  const routeToDisplay = computed<RouteLocationNormalized>(() => {
    if (props.route) return props.route;

    // Safe access with null checks
    if (!injectedRoute) {
      return START_LOCATION_NORMALIZED;
    }

    // Properly handle signal values
    const currentRoute = injectedRoute.value || injectedRoute;
    if (!currentRoute || typeof currentRoute !== 'object' || !('path' in currentRoute)) {
      return START_LOCATION_NORMALIZED;
    }

    return currentRoute;
  });

  const injectedDepth = inject<Signal<number>>(viewDepthKey) || signal(0);
  const depth = computed<number>(() => {
    let initialDepth = injectedDepth.value || 0;
    const route = routeToDisplay.value;
    if (!route || !route.matched) return initialDepth;

    const { matched } = route;
    let matchedRoute: RouteLocationNormalized['matched'][number] | undefined;
    while ((matchedRoute = matched[initialDepth]) && !matchedRoute.components) {
      initialDepth++;
    }
    return initialDepth;
  });

  const matchedRouteRef = computed<RouteLocationNormalized['matched'][number] | undefined>(() => {
    const route = routeToDisplay.value;
    return route && route.matched ? route.matched[depth.value] : undefined;
  });

  // Provide context for nested RouterViews and navigation hooks
  const depthSignal = signal(depth.value + 1);
  provide(viewDepthKey, depthSignal);
  provide(matchedRouteKey, matchedRouteRef);
  provide(routerViewLocationKey, routeToDisplay);

  const renderView = computed(() => {
    const matchedRoute = matchedRouteRef.value;
    const ViewComponent =
      matchedRoute && matchedRoute.components
        ? matchedRoute.components[props.name || 'default']
        : null;

    if (ViewComponent) {
      try {
        return createComponent(ViewComponent, {});
      } catch (error) {
        if (props.onError) {
          props.onError(error instanceof Error ? error : new Error(String(error)));
        }
        return props.fallback ? createComponent(props.fallback, {}) : props.children;
      }
    }

    return props.children;
  });

  return [() => renderView.value];
};
