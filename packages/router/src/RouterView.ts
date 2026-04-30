import {
  type ComponentProps,
  createComponent,
  error as logError,
  getActiveScope,
  inject,
  insert,
  onDestroy,
  provide,
  runWithScope,
} from 'essor';
import { type Computed, type Signal, computed, effect, signal } from '@estjs/signals';
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

function normalizeDepth(injectedDepth: Signal<number> | Computed<number> | number): number {
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
function safeRenderComponent(
  component: RouteComponent,
  onError?: (error: Error) => void,
  fallback?: RouteComponent | RouterViewChildren,
): any {
  try {
    return createComponent(component, {});
  } catch (caught) {
    const normalized = caught instanceof Error ? caught : new Error(String(caught));
    // Handle rendering errors
    if (__DEV__) {
      logError('RouterView failed to render component:', normalized);
    }
    if (onError) {
      onError(normalized);
    }

    // Render fallback if available
    if (fallback) {
      if (typeof fallback === 'function') {
        try {
          return createComponent(fallback as RouteComponent, {});
        } catch (fallbackError) {
          if (__DEV__) {
            const normalizedFallback =
              fallbackError instanceof Error
                ? fallbackError
                : new Error(String(fallbackError));
            logError('RouterView failed to render fallback component:', normalizedFallback);
          }
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
  const ownerScope = getActiveScope();
  const withOwnerScope = <T>(fn: () => T): T => {
    if (ownerScope && !ownerScope.isDestroyed) {
      return runWithScope(ownerScope, fn);
    }
    return fn();
  };

  // Get router from props or injection
  const router = props.router || inject(routerKey);

  // Validate router existence
  if (!router) {
    if (__DEV__) {
      logError(
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
  const injectedDepth = inject<Signal<number> | Computed<number> | number>(viewDepthKey) || 0;
  const depth = signal<number>(0);
  const matchedRouteRef = signal<RouteLocationNormalized['matched'][number] | undefined>(undefined);
  const matchedRouteComputed = computed<RouteLocationNormalized['matched'][number] | undefined>(
    () => matchedRouteRef.value,
  );

  const viewName = computed(() => props.name || 'default');

  // Provide context for nested RouterViews and navigation hooks
  provide(
    viewDepthKey,
    computed(() => depth.value + 1),
  );
  provide(matchedRouteKey, matchedRouteComputed);
  provide(routerViewLocationKey, routeToDisplay);

  effect(() => {
    const route = routeToDisplay.value;
    const baseDepth = normalizeDepth(injectedDepth);
    const nextDepth = calculateViewDepth(baseDepth, route);

    depth.value = nextDepth;
    matchedRouteRef.value = route?.matched?.[nextDepth];
  });

  const renderedView = signal<any>(undefined);
  const resolveRenderedView = (
    matchedRoute: RouteLocationNormalized['matched'][number] | undefined,
    currentViewName: string,
  ) => {
    const ViewComponent = matchedRoute?.components?.[currentViewName];

    if (ViewComponent) {
      return safeRenderComponent(ViewComponent, props.onError, props.fallback || props.children);
    }

    return props.children;
  };

  effect(() => {
    const matchedRoute = matchedRouteRef.value;
    const currentViewName = viewName.value;
    const rendered = withOwnerScope(() => resolveRenderedView(matchedRoute, currentViewName));

    renderedView.value = rendered;

    if (!matchedRoute) return;

    matchedRoute.instances[currentViewName] = rendered || null;
    const enterCallbacks = matchedRoute.enterCallbacks[currentViewName] || [];
    if (rendered && enterCallbacks.length > 0) {
      enterCallbacks.forEach(callback => callback(rendered));
      matchedRoute.enterCallbacks[currentViewName] = [];
    }
  });

  onDestroy(() => {
    const matchedRoute = matchedRouteRef.value;
    if (!matchedRoute) return;
    matchedRoute.instances[viewName.value] = null;
  });

  const outlet = document.createElement('div');
  outlet.style.display = 'contents';
  insert(outlet, () => renderedView.value);
  return outlet;
};
