import { computed, createComponent, effect, inject, onDestroy, signal, stop } from 'essor';
import { isArray, isFunction, isObject, isString } from '@estjs/shared';
import { isSameRouteLocationParams, isSameRouteRecord } from './location';
import { noop } from './utils';
import { logRouterError, warn } from './warning';
import { useRoute, useRouter } from './useApi';
import { LinkComponent } from './linkComponent';
import { routeLocationKey, routerKey } from './injectionSymbols';
import { usePrefetch } from './router/usePrefetch';
import type { RouteRecord } from './matcher/types';
import type { NavigationFailure } from './errors';
import type { RouteLocationNormalized, RouteLocationRawTyped } from './types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RouterLinkChildren =
  | string
  | number
  | (() => string | number | HTMLElement | null)
  | HTMLElement
  | null
  | undefined;

export interface RouterLinkOptions {
  /** Route Location the link should navigate to when clicked on. */
  to: RouterLinkTo;
  /** Calls `router.replace` instead of `router.push`. */
  replace?: boolean;
}

export type RouterLinkTo =
  | RouteLocationRawTyped
  | SignalLike<RouteLocationRawTyped>
  | (() => RouteLocationRawTyped);

interface SignalLike<T> {
  readonly value: T;
  peek?: () => T;
}

export interface RouterLinkProps extends RouterLinkOptions {
  /** Whether RouterLink should not wrap its content in an `a` tag. */
  custom?: boolean;
  /** Class to apply when the link is active */
  activeClass?: string;
  /** Class to apply when the link is exact active */
  exactActiveClass?: string;
  /**
   * Value passed to the attribute `aria-current` when the link is exact active.
   * @defaultValue `'page'`
   */
  ariaCurrentValue?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  /** Whether to use View Transitions API when navigating. */
  viewTransition?: boolean;
  /**
   * Prefetch strategy for this link.
   * - `intent`: on pointer/focus intent (default)
   * - `render`: preload immediately on render
   * - `viewport`: preload when the link enters viewport
   * - `false`: disable preload
   */
  prefetch?: 'intent' | 'render' | 'viewport' | false;
  /** Children content for the link */
  children?: RouterLinkChildren;
  /** Additional CSS class to apply to the link element */
  class?: string;
}

export interface UseLinkReturn {
  route: { readonly value: RouteLocationNormalized };
  href: { readonly value: string };
  isActive: { readonly value: boolean };
  isExactActive: { readonly value: boolean };
  navigate(e?: MouseEvent): Promise<void | NavigationFailure>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const isSignalLike = (value: unknown): value is SignalLike<unknown> =>
  !!value && isObject(value) && 'value' in value;

/**
 * Reads the `to` prop, supporting raw values, signals, and functions.
 * When `tracked` is false, uses `peek()` on signals to avoid subscriptions.
 */
function resolveTo(to: RouterLinkProps['to'], tracked = true): RouteLocationRawTyped {
  if (isFunction(to)) return (to as () => RouteLocationRawTyped)();
  if (!isSignalLike(to)) return to;
  if (!tracked && isFunction(to.peek)) return to.peek();
  return to.value;
}

/** Fallback route used when route resolution fails */
const FALLBACK_ROUTE: RouteLocationNormalized = {
  path: '/',
  name: undefined,
  params: {},
  query: {},
  hash: '',
  fullPath: '/',
  matched: [],
  meta: {},
  href: '/',
  redirectedFrom: undefined,
};

let prefetchIdCounter = 0;

function nextPrefetchId(): string {
  return `essor-router-prefetch-${++prefetchIdCounter}`;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Guards navigation events based on modifier keys and other conditions.
 * Returns `true` if navigation should proceed.
 */
function guardEvent(e: MouseEvent): boolean {
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return false;
  if (e.defaultPrevented) return false;
  if (e.button !== undefined && e.button !== 0) return false;

  if (e.currentTarget) {
    const target = (e.currentTarget as Element).getAttribute('target');
    if (target && /\b_blank\b/i.test(target)) return false;
  }

  e.preventDefault();
  return true;
}

/**
 * Checks if `outer` params include all `inner` params.
 */
function includesParams(
  outer: Record<string, string | string[]>,
  inner: Record<string, string | string[]>,
): boolean {
  for (const key in inner) {
    const innerValue = inner[key];
    const outerValue = outer[key];

    if (isString(innerValue)) {
      if (innerValue !== outerValue) return false;
    } else if (
      !isArray(outerValue) ||
      outerValue.length !== innerValue.length ||
      innerValue.some((v, i) => v !== outerValue[i])
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Gets the original path from a route record, handling aliases.
 */
function getOriginalPath(record: RouteRecord | undefined): string {
  return record ? (record.aliasOf ? record.aliasOf.path : record.path) : '';
}

/**
 * Resolves a link class from prop → global option → default, in priority order.
 */
const getLinkClass = (
  propClass: string | undefined,
  globalClass: string | undefined,
  defaultClass: string,
): string => propClass ?? globalClass ?? defaultClass;

// ---------------------------------------------------------------------------
// useLink
// ---------------------------------------------------------------------------

/**
 * Hook that provides reactive link properties and navigation handler.
 */
export function useLink(props: RouterLinkProps): UseLinkReturn {
  const router = inject(routerKey);
  const routeContext = inject(routeLocationKey);

  if (!router) {
    const msg =
      'useLink() must be used within a RouterView component that provides router context.';
    if (__DEV__) logRouterError(msg);
    throw new Error(msg);
  }

  if (!routeContext) {
    const msg = 'useLink() requires route context. Ensure RouterLink is inside a RouterView.';
    if (__DEV__) logRouterError(msg);
    throw new Error(msg);
  }

  const currentRoute = useRoute() as any;

  // Track dynamic `to` props (signals / functions)
  const isDynamic = isFunction(props.to) || isSignalLike(props.to);
  const trackedTo = isDynamic ? computed(() => resolveTo(props.to)) : null;

  // --- Resolved route ---
  const route = computed<RouteLocationNormalized>(() => {
    const to = trackedTo ? trackedTo.value : resolveTo(props.to);
    try {
      return router.resolve(to);
    } catch (error) {
      if (__DEV__) warn('Failed to resolve route for "to" prop:', to, '\nError:', error);
      return FALLBACK_ROUTE;
    }
  });

  // --- Active state ---
  const activeRecordIndex = computed(() => {
    const resolved = route.value;
    if (!resolved?.matched || !currentRoute?.matched) return -1;

    const { matched } = resolved;
    const lastMatched = matched[matched.length - 1];
    const { matched: currentMatched } = currentRoute;
    if (!lastMatched || !currentMatched.length) return -1;

    const index = currentMatched.findIndex((record: RouteRecord) =>
      isSameRouteRecord(lastMatched, record),
    );

    if (index > -1) return index;

    // Handle alias routes
    const parentPath = getOriginalPath(matched[matched.length - 2] as RouteRecord | undefined);
    return matched.length > 1 &&
      getOriginalPath(lastMatched) === parentPath &&
      currentMatched[currentMatched.length - 1].path !== parentPath
      ? currentMatched.findIndex((record: RouteRecord) =>
          isSameRouteRecord(matched[matched.length - 2] as RouteRecord, record),
        )
      : index;
  });

  const isActive = computed(() => {
    if (!currentRoute?.params || !route.value?.params) return false;
    return activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params);
  });

  const isExactActive = computed(() => {
    if (!currentRoute?.matched || !currentRoute?.params || !route.value?.params) return false;
    return (
      activeRecordIndex.value > -1 &&
      activeRecordIndex.value === currentRoute.matched.length - 1 &&
      isSameRouteLocationParams(currentRoute.params, route.value.params)
    );
  });

  // --- Href (computed, no need for separate signal + effect) ---
  const href = computed(() => route.value?.href || '#');

  // --- Navigation handler ---
  function navigate(e: MouseEvent = {} as MouseEvent): Promise<void | NavigationFailure> {
    if (!guardEvent(e)) return Promise.resolve();

    const to = resolveTo(props.to, false);
    const doNavigate = () => router[props.replace ? 'replace' : 'push'](to as any).catch(noop);

    const navigation = new Promise<void | NavigationFailure>((resolve) => {
      // Defer to next microtask so the event handler can complete first
      Promise.resolve().then(() => doNavigate().then(resolve));
    });

    // Use View Transitions API if available and enabled
    if (
      props.viewTransition &&
      typeof document !== 'undefined' &&
      'startViewTransition' in document
    ) {
      (document as any).startViewTransition(() => navigation);
    }

    return navigation;
  }

  return { route, href, isActive, isExactActive, navigate };
}

// ---------------------------------------------------------------------------
// RouterLink component
// ---------------------------------------------------------------------------

/**
 * RouterLink component for declarative navigation.
 */
export const RouterLink = (props: RouterLinkProps): any => {
  const link = useLink({
    to: props.to,
    replace: props.replace,
    viewTransition: props.viewTransition,
  });

  const router = useRouter();
  const { options } = router;
  const prefetchId = nextPrefetchId();

  // --- Prefetch ---
  const resolvePrefetchMode = () => {
    if (props.prefetch === false) return false;
    if (props.prefetch) return props.prefetch;
    const routeStart = (link.route.value?.matched?.at(-1) as RouteRecord | undefined)?.start as
      | { preload?: 'intent' | 'render' | 'viewport' }
      | undefined;
    return routeStart?.preload || 'intent';
  };

  const prefetch = usePrefetch({
    mode: resolvePrefetchMode(),
    id: prefetchId,
    preload: () => router.preloadRoute(resolveTo(props.to, false) as any),
  });

  prefetch.onRender();
  Promise.resolve().then(prefetch.onViewport);
  onDestroy(() => prefetch.dispose());

  // --- Reactive DOM state ---
  const ariaCurrent = signal<RouterLinkProps['ariaCurrentValue'] | null>(
    link.isExactActive.value ? (props.ariaCurrentValue ?? 'page') : null,
  );

  const buildClass = () => {
    const classes: string[] = [];
    if (props.class) classes.push(props.class);
    if (link.isActive.value) {
      classes.push(getLinkClass(props.activeClass, options?.linkActiveClass, 'router-link-active'));
    }
    if (link.isExactActive.value) {
      classes.push(
        getLinkClass(
          props.exactActiveClass,
          options?.linkExactActiveClass,
          'router-link-exact-active',
        ),
      );
    }
    return classes.join(' ');
  };

  const elClass = signal(buildClass());
  const domStateRunner = effect(() => {
    ariaCurrent.value = link.isExactActive.value ? (props.ariaCurrentValue ?? 'page') : null;
    elClass.value = buildClass();
  });
  onDestroy(() => stop(domStateRunner));

  // --- Click handler ---
  const handleClick = (e: MouseEvent) => {
    if (!props.custom) link.navigate(e);
  };

  // --- Render ---
  if (props.custom) {
    return isFunction(props.children) ? props.children() : props.children;
  }

  return createComponent(LinkComponent, {
    'ariaCurrent': ariaCurrent,
    'href': link.href,
    'onClick': handleClick,
    'onMouseenter': prefetch.onIntent,
    'onFocus': prefetch.onIntent,
    'onTouchstart': prefetch.onIntent,
    'onElement': prefetch.setTarget,
    'data-router-prefetch-id': prefetchId,
    'class': elClass,
    'children': props.children,
  });
};
