import {
  type ComponentProps,
  type Signal,
  computed,
  createComponent,
  inject,
  onDestroy,
  provide,
  signal,
} from 'essor';
import {
  matchedRouteKey,
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
function calculateViewDepth(injectedDepth: Signal<number>, route: RouteLocationNormalized): number {
  let depth = injectedDepth.value || 0;

  if (!route?.matched) return depth;

  const { matched } = route;
  let matchedRoute: RouteLocationNormalized['matched'][number] | undefined;

  // Skip matched routes without components
  while ((matchedRoute = matched[depth]) && !matchedRoute.components) {
    depth++;
  }

  return depth;
}

/**
 * Safely renders a component with error handling
 * @param component - Component to render
 * @param onError - Error handler callback
 * @param fallback - Fallback component or children
 * @returns Rendered component or fallback
 */
function safeRenderComponent(
  component: RouteComponent,
  onError?: (error: Error) => void,
  fallback?: RouteComponent | RouterViewChildren,
): any {
  try {
    return createComponent(component, {});
  } catch (error) {
    // Handle rendering errors
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }

    // Render fallback if available
    if (fallback) {
      if (typeof fallback === 'function') {
        try {
          return createComponent(fallback as RouteComponent, {});
        } catch {
          return null;
        }
      }
      return fallback;
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
  const router = props.router || inject(routerKey);

  // Validate router existence
  if (!router) {
    throw new Error(
      'RouterView requires a router instance. ' +
        'Please provide a router via props or ensure RouterView is used within a router context. ' +
        'Make sure you have created a router instance and passed it to RouterView, or that a parent component provides the router through injection.',
    );
  }

  // Initialize router and setup cleanup
  router.init();
  onDestroy(() => {
    router.destroy();
  });

  // Get route to display (from props or injection)
  const injectedRoute = inject(routerViewLocationKey) || router.currentRoute;
  const routeToDisplay = computed<RouteLocationNormalized>(() => {
    if (props.route) return props.route;

    if (!injectedRoute) {
      return START_LOCATION_NORMALIZED;
    }

    // Handle signal values
    const currentRoute = injectedRoute.value || injectedRoute;
    if (!currentRoute || typeof currentRoute !== 'object' || !('path' in currentRoute)) {
      return START_LOCATION_NORMALIZED;
    }

    return currentRoute;
  });

  // Calculate view depth for nested RouterViews
  const injectedDepth = inject<Signal<number>>(viewDepthKey) || signal(0);
  const depth = computed<number>(() => calculateViewDepth(injectedDepth, routeToDisplay.value));

  // Get matched route at current depth
  const matchedRouteRef = computed<RouteLocationNormalized['matched'][number] | undefined>(() => {
    const route = routeToDisplay.value;
    return route?.matched?.[depth.value];
  });

  // Provide context for nested RouterViews and navigation hooks
  const depthSignal = signal(depth.value + 1);
  provide(viewDepthKey, depthSignal);
  provide(matchedRouteKey, matchedRouteRef);
  provide(routerViewLocationKey, routeToDisplay);

  // Render the matched component
  const renderView = computed(() => {
    const matchedRoute = matchedRouteRef.value;
    const viewName = props.name || 'default';

    // Get component from matched route
    const ViewComponent = matchedRoute?.components?.[viewName];

    if (ViewComponent) {
      return safeRenderComponent(ViewComponent, props.onError, props.fallback || props.children);
    }

    // No component matched, render children
    return props.children;
  });

  return [() => renderView.value];
};
