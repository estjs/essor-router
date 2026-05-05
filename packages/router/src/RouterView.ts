import {
  type ComponentProps,
  type Signal,
  computed,
  createComponent,
  effect,
  inject,
  onDestroy,
  provide,
  signal,
  untrack,
} from 'essor';
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

function logRouterError(...args: unknown[]) {
  if (__DEV__) {
    console.error(...args);
  }
}

// Define specific types for RouterView children
export type RouterViewChildren =
  | string
  | number
  | (() => string | number | HTMLElement | RouteComponent | null)
  | HTMLElement
  | RouteComponent
  | null
  | undefined;

/**
 * Props for the RouterView component
 */
export interface RouterViewProps extends ComponentProps {
  /**
   * Name of the RouterView to render. Defaults to 'default'.
   * Used for named views in route configuration.
   */
  name?: string;
  /**
   * Route to display. If not provided, uses the current route from router.
   */
  route?: RouteLocationNormalized;
  /**
   * Children to render when no route matches
   */
  children?: RouterViewChildren;
  /**
   * Router instance. If not provided, will be injected from context.
   */
  router?: Router;
  /**
   * Fallback component to render when component loading fails
   */
  fallback?: RouteComponent;
  /**
   * Error handler callback for component rendering errors
   */
  onError?: (error: Error) => void;
}

/**
 * Calculates the depth of the current RouterView in the nested hierarchy
 * @param injectedDepth - Depth from parent RouterView
 * @param route - Current route to display
 * @returns Computed depth value
 */
function hasRenderableComponent(
  record: RouteLocationNormalized['matched'][number] | undefined,
): boolean {
  if (!record?.components) return false;
  for (const key in record.components) {
    if (record.components[key]) return true;
  }
  return false;
}

function calculateViewDepth(injectedDepth: number, route: RouteLocationNormalized): number {
  let depth = injectedDepth || 0;

  if (!route?.matched) return depth;

  const { matched } = route;
  let matchedRoute: RouteLocationNormalized['matched'][number] | undefined;

  // Skip matched routes without components
  while ((matchedRoute = matched[depth]) && !hasRenderableComponent(matchedRoute)) {
    depth++;
  }

  return depth;
}

function normalizeDepth(injectedDepth: Signal<number> | number): number {
  if (typeof injectedDepth === 'number') {
    return injectedDepth;
  }
  return injectedDepth.value || 0;
}

/**
 * Safely renders a component with error handling
 * @param component - Component to render
 * @param onError - Error handler callback
 * @param fallback - Fallback component or children
 * @returns Rendered component or fallback
 */
function invokeComponent(component: RouteComponent, props: Record<string, unknown>): unknown {
  // Function components can be invoked directly; this lets us catch render-time
  // errors synchronously inside the caller's try/catch. For non-function
  // components fall back to essor's createComponent so the instance lifecycle
  // (mount/unmount) still runs normally.
  if (typeof component === 'function') {
    return (component as (p: Record<string, unknown>) => unknown)(props);
  }
  return createComponent(component, props);
}

function safeRenderComponent(
  component: RouteComponent,
  onError?: (error: Error) => void,
  fallback?: RouteComponent | RouterViewChildren,
): any {
  // Wrap the component in a try/catch component so errors thrown during the
  // component's render (including those raised during essor's mount phase,
  // which would otherwise surface as unhandled effect errors) are caught here
  // and surfaced through `onError` / fallback rendering.
  const SafeWrapper = () => {
    try {
      return invokeComponent(component, {});
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      if (__DEV__) {
        logRouterError('RouterView failed to render component:', normalized);
      }
      if (onError) {
        onError(normalized);
      }

      if (fallback) {
        if (typeof fallback === 'function') {
          try {
            return invokeComponent(fallback as RouteComponent, {});
          } catch (fallbackError) {
            if (__DEV__) {
              const normalizedFallback =
                fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
              logRouterError('RouterView failed to render fallback component:', normalizedFallback);
            }
            return null;
          }
        }
        return fallback;
      }

      return null;
    }
  };

  try {
    return createComponent(SafeWrapper, {});
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    if (__DEV__) {
      logRouterError('RouterView failed to render component:', normalized);
    }
    if (onError) {
      onError(normalized);
    }
    return null;
  }
}

/**
 * RouterView component that renders the matched route component
 * Supports nested routing and named views
 * @param props - RouterView props
 * @returns Rendered route component or children
 */
export const RouterView = (props: RouterViewProps) => {
  // Get router from props or injection
  const injectedRouter = inject(routerKey);
  const router = props.router || injectedRouter;
  const isIndependentRouterRoot = !!props.router && props.router !== injectedRouter;

  // Validate router existence
  if (!router) {
    if (__DEV__) {
      logRouterError(
        'RouterView requires a router instance. ' +
          'Please provide a router via props or ensure RouterView is used within a router context. ' +
          'Make sure you have created a router instance and passed it to RouterView, or that a parent component provides the router through injection.',
      );
    }
    throw new Error(
      'RouterView requires a router instance. ' +
        'Please provide a router via props or ensure RouterView is used within a router context. ' +
        'Make sure you have created a router instance and passed it to RouterView, or that a parent component provides the router through injection.',
    );
  }

  // Initialize router and setup cleanup
  router.init();

  onDestroy(() => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => router.destroy());
      return;
    }
    Promise.resolve().then(() => router.destroy());
  });


  // Get route to display (from props or injection)
  const injectedRoute = inject(routerViewLocationKey) || router.currentRoute;

  // Use a signal + effect instead of computed for routeToDisplay.
  // Signal reads inside Proxy traps (e.g. createRouteAccessor) are NOT tracked
  // by essor's computed, so a computed that returns a Proxy-based route would
  // never re-evaluate. An effect reliably tracks signal reads in its body, so
  // we write the resolved route into a signal that downstream consumers read.
  const routeToDisplay = signal<RouteLocationNormalized>(START_LOCATION_NORMALIZED);
  const depth = signal<number>(0);
  const matchedRouteRef = signal<RouteLocationNormalized['matched'][number] | undefined>(undefined);

  // Calculate view depth for nested RouterViews
  const injectedDepth = isIndependentRouterRoot
    ? 0
    : inject<Signal<number> | number>(viewDepthKey) || 0;

  // Provide context for nested RouterViews and navigation hooks
  provide(routerKey, router);
  provide(routeLocationKey, routeToDisplay as any);
  provide(viewDepthKey, computed(() => depth.value + 1));
  provide(matchedRouteKey, computed(() => matchedRouteRef.value));

  // Single effect: resolve route from signal, then compute depth & matched record.
  // Merging avoids a redundant intermediate signal write + re-read cycle.
  effect(() => {
    // Resolve the current route
    if (props.route) {
      routeToDisplay.value = props.route;
    } else if (!injectedRoute) {
      routeToDisplay.value = START_LOCATION_NORMALIZED;
    } else {
      const currentRoute = (injectedRoute as any).value || injectedRoute;
      routeToDisplay.value =
        currentRoute && typeof currentRoute === 'object' && 'path' in currentRoute
          ? currentRoute
          : START_LOCATION_NORMALIZED;
    }

    // Compute depth and matched record from the resolved route
    const route = routeToDisplay.value;
    const baseDepth = normalizeDepth(injectedDepth);
    const nextDepth = calculateViewDepth(baseDepth, route);

    depth.value = nextDepth;
    matchedRouteRef.value = route?.matched?.[nextDepth];
  });

  const renderView = computed(() => {
    const matchedRoute = matchedRouteRef.value;
    const currentViewName = props.name || 'default';

    // Get component from matched route
    const ViewComponent = matchedRoute?.components?.[currentViewName];

    const rendered = ViewComponent
      ? safeRenderComponent(ViewComponent, props.onError, props.fallback || props.children)
      : props.children;

    if (matchedRoute) {
      // Track mounted component instance so beforeRouteUpdate/Leave guards can
      // resolve `this` to the correct view, matching vue-router semantics.
      matchedRoute.instances[currentViewName] = (rendered as any) || null;

      // Flush any beforeRouteEnter `next(vm => ...)` callbacks registered
      // during navigation for this named view and clear them so they only run
      // once per enter.
      const enterCallbacks = matchedRoute.enterCallbacks[currentViewName];
      if (rendered && enterCallbacks && enterCallbacks.length > 0) {
        const callbacks = enterCallbacks.slice();
        matchedRoute.enterCallbacks[currentViewName] = [];
        untrack(() => {
          callbacks.forEach((cb) => cb(rendered as any));
        });
      }
    }
    return rendered;
  });

  onDestroy(() => {
    const matchedRoute = matchedRouteRef.value;
    if (!matchedRoute) return;
    matchedRoute.instances[props.name || 'default'] = null;
  });

  return [() => renderView.value];
};
