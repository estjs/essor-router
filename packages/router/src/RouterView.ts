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
import { enqueueMicrotask, logRouterError } from './warning';
import type { Router } from './router';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Children content accepted by RouterView */
export type RouterViewChildren =
  | string
  | number
  | (() => string | number | HTMLElement | RouteComponent | null)
  | HTMLElement
  | RouteComponent
  | null
  | undefined;

/** Props for the RouterView component */
export interface RouterViewProps extends ComponentProps {
  /** Name of the RouterView to render. Defaults to 'default'. */
  name?: string;
  /** Route to display. If not provided, uses the current route from router. */
  route?: RouteLocationNormalized;
  /** Children to render when no route matches */
  children?: RouterViewChildren;
  /** Router instance. If not provided, will be injected from context. */
  router?: Router;
  /** Fallback component to render when component loading fails */
  fallback?: RouteComponent;
  /** Error handler callback for component rendering errors */
  onError?: (error: Error) => void;
}

// ---------------------------------------------------------------------------
// View depth helpers
// ---------------------------------------------------------------------------

function hasRenderableComponent(
  record: RouteLocationNormalized['matched'][number] | undefined,
): boolean {
  return record?.components ? Object.values(record.components).some(Boolean) : false;
}

/**
 * Calculates the effective view depth by skipping matched records that
 * have no renderable component (e.g. layout-only records).
 */
function calculateViewDepth(baseDepth: number, route: RouteLocationNormalized): number {
  if (!route?.matched) return baseDepth;

  let depth = baseDepth;
  const { matched } = route;
  while (matched[depth] && !hasRenderableComponent(matched[depth])) {
    depth++;
  }
  return depth;
}

function normalizeDepth(injectedDepth: Signal<number> | number): number {
  return typeof injectedDepth === 'number' ? injectedDepth : injectedDepth.value || 0;
}

// ---------------------------------------------------------------------------
// Safe component rendering
// ---------------------------------------------------------------------------

function invokeComponent(component: RouteComponent, props: Record<string, unknown>): unknown {
  // Function components can be invoked directly; this lets us catch render-time
  // errors synchronously inside the caller's try/catch. For non-function
  // components fall back to essor's createComponent so the instance lifecycle
  // (mount/unmount) still runs normally.
  return typeof component === 'function'
    ? (component as (p: Record<string, unknown>) => unknown)(props)
    : createComponent(component, props);
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Wraps component rendering in error boundaries, supporting fallback
 * components and error callbacks.
 */
function safeRenderComponent(
  component: RouteComponent,
  onError?: (error: Error) => void,
  fallback?: RouteComponent | RouterViewChildren,
): any {
  const SafeWrapper = () => {
    try {
      return invokeComponent(component, {});
    } catch (error) {
      const normalized = normalizeError(error);
      if (__DEV__) logRouterError('RouterView failed to render component:', normalized);
      onError?.(normalized);

      if (typeof fallback === 'function') {
        try {
          return invokeComponent(fallback as RouteComponent, {});
        } catch (fallbackError) {
          if (__DEV__)
            logRouterError('RouterView failed to render fallback:', normalizeError(fallbackError));
          return null;
        }
      }
      return fallback ?? null;
    }
  };

  try {
    return createComponent(SafeWrapper, {});
  } catch (error) {
    if (__DEV__) logRouterError('RouterView failed to render component:', normalizeError(error));
    onError?.(normalizeError(error));
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route resolution helper
// ---------------------------------------------------------------------------

function resolveRoute(
  propsRoute: RouteLocationNormalized | undefined,
  injectedRoute: any,
): RouteLocationNormalized {
  if (propsRoute) return propsRoute;
  if (!injectedRoute) return START_LOCATION_NORMALIZED;

  const current = injectedRoute.value ?? injectedRoute;
  return current && typeof current === 'object' && 'path' in current
    ? current
    : START_LOCATION_NORMALIZED;
}

// ---------------------------------------------------------------------------
// RouterView component
// ---------------------------------------------------------------------------

/**
 * Renders the matched route component for the current depth level.
 * Supports nested routing, named views, and error boundaries.
 */
export const RouterView = (props: RouterViewProps) => {
  // --- Router resolution ---
  const injectedRouter = inject(routerKey);
  const router = props.router || injectedRouter;
  const isIndependentRoot = !!props.router && props.router !== injectedRouter;

  if (!router) {
    const msg =
      'RouterView requires a router instance. ' +
      'Provide a router via props or ensure RouterView is used within a router context.';
    if (__DEV__) logRouterError(msg);
    throw new Error(msg);
  }

  // --- Lifecycle ---
  router.init();
  onDestroy(() => enqueueMicrotask(() => router.destroy()));

  // --- Reactive state ---
  const injectedRoute = inject(routerViewLocationKey) || router.currentRoute;
  const routeToDisplay = signal<RouteLocationNormalized>(START_LOCATION_NORMALIZED);
  const depth = signal<number>(0);
  const matchedRouteRef = signal<RouteLocationNormalized['matched'][number] | undefined>(undefined);

  // Calculate base depth for nested RouterViews
  const injectedDepth = isIndependentRoot ? 0 : inject<Signal<number> | number>(viewDepthKey) || 0;

  // --- Context provision for children ---
  provide(routerKey, router);
  provide(routeLocationKey, routeToDisplay as any);
  provide(
    viewDepthKey,
    computed(() => depth.value + 1),
  );
  provide(
    matchedRouteKey,
    computed(() => matchedRouteRef.value),
  );

  // --- Route & depth tracking ---
  // Single effect: resolve route, compute depth, and update matched record.
  // Merging avoids a redundant intermediate signal write + re-read cycle.
  effect(() => {
    const route = resolveRoute(props.route, injectedRoute);
    routeToDisplay.value = route;

    const baseDepth = normalizeDepth(injectedDepth);
    const nextDepth = calculateViewDepth(baseDepth, route);
    depth.value = nextDepth;
    matchedRouteRef.value = route?.matched?.[nextDepth];
  });

  // --- Render ---
  const renderView = computed(() => {
    const matchedRoute = matchedRouteRef.value;
    const viewName = props.name || 'default';
    const ViewComponent = matchedRoute?.components?.[viewName];

    const rendered = ViewComponent
      ? safeRenderComponent(ViewComponent, props.onError, props.fallback || props.children)
      : props.children;

    if (matchedRoute) {
      // Track mounted component instance for beforeRouteUpdate/Leave guards
      matchedRoute.instances[viewName] = (rendered as any) || null;

      // Flush beforeRouteEnter `next(vm => ...)` callbacks
      const enterCallbacks = matchedRoute.enterCallbacks[viewName];
      if (rendered && enterCallbacks?.length) {
        const callbacks = enterCallbacks.slice();
        matchedRoute.enterCallbacks[viewName] = [];
        untrack(() => callbacks.forEach((cb) => cb(rendered as any)));
      }
    }

    return rendered;
  });

  // --- Cleanup ---
  onDestroy(() => {
    const matchedRoute = matchedRouteRef.value;
    if (matchedRoute) matchedRoute.instances[props.name || 'default'] = null;
  });

  return [() => renderView.value];
};
