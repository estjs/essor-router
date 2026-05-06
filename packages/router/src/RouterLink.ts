import { computed, createComponent, effect, onDestroy, signal, stop } from 'essor';
import { isSameRouteLocationParams, isSameRouteRecord } from './location';
import { isArray, noop } from './utils';
import { warn } from './warning';
import { useRoute, useRouter } from './useApi';
import { LinkComponent } from './linkComponent';
import { usePrefetch } from './router/usePrefetch';
import type { RouteRecord } from './matcher/types';
import type { NavigationFailure } from './errors';
import type { RouteLocationNormalized, RouteLocationRawTyped } from './types';

function logRouterError(...args: unknown[]) {
  if (__DEV__) {
    console.error(...args);
  }
}

// Define specific types for RouterLink children
export type RouterLinkChildren =
  | string
  | number
  | (() => string | number | HTMLElement | null)
  | HTMLElement
  | null
  | undefined;

export interface RouterLinkOptions {
  /**
   * Route Location the link should navigate to when clicked on.
   */
  to: RouterLinkTo;
  /**
   * Calls `router.replace` instead of `router.push`.
   */
  replace?: boolean;
}

export type RouterLinkTo =
  | RouteLocationRawTyped
  | SignalLike<RouteLocationRawTyped>
  | (() => RouteLocationRawTyped);

interface ReadonlyValue<T> {
  readonly value: T;
}

interface SignalLike<T> extends ReadonlyValue<T> {
  peek?: () => T;
}

export interface RouterLinkProps extends RouterLinkOptions {
  /**
   * Whether RouterLink should not wrap its content in an `a` tag. Useful when
   * using custom rendering with scoped slots.
   */
  custom?: boolean;
  /**
   * Class to apply when the link is active
   */
  activeClass?: string;
  /**
   * Class to apply when the link is exact active
   */
  exactActiveClass?: string;
  /**
   * Value passed to the attribute `aria-current` when the link is exact active.
   *
   * @defaultValue `'page'`
   */
  ariaCurrentValue?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  /**
   * Whether to use View Transitions API when navigating.
   */
  viewTransition?: boolean;
  /**
   * Prefetch strategy for this link.
   * - `intent`: on pointer/focus intent (default)
   * - `render`: preload immediately on render
   * - `viewport`: preload when the link enters viewport
   * - `false`: disable preload
   */
  prefetch?: 'intent' | 'render' | 'viewport' | false;
  /**
   * Children content for the link
   */
  children?: RouterLinkChildren;
  /**
   * Additional CSS class to apply to the link element
   */
  class?: string;
}

export interface UseLinkReturn {
  route: ReadonlyValue<RouteLocationNormalized>;
  href: ReadonlyValue<string>;
  isActive: ReadonlyValue<boolean>;
  isExactActive: ReadonlyValue<boolean>;
  navigate(e?: MouseEvent): Promise<void | NavigationFailure>;
}

const isSignalLike = (value: unknown): value is SignalLike<unknown> =>
  !!value && typeof value === 'object' && 'value' in value;

const readTo = (to: RouterLinkProps['to']) => {
  if (isSignalLike(to)) return to.value;
  if (typeof to === 'function') return (to as () => RouteLocationRawTyped)();
  return to;
};

const peekTo = (to: RouterLinkProps['to']) => {
  if (!isSignalLike(to)) {
    return typeof to === 'function' ? (to as () => RouteLocationRawTyped)() : to;
  }
  return typeof to.peek === 'function' ? to.peek() : to.value;
};

/**
 * Fallback route used when route resolution fails
 */
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
let routerLinkPrefetchId = 0;
const routerPrefetchCounters = new WeakMap<object, number>();

/**
 * Hook that provides reactive link properties and navigation handler
 * @param props - RouterLink props
 * @returns Link state and navigation handler
 */
export function useLink(props: RouterLinkProps): UseLinkReturn {
  let router: any;
  try {
    router = useRouter();
  } catch {
    if (__DEV__) {
      logRouterError(
        'useLink() requires an active router instance. ' +
          'Make sure you have created a router with createRouter() and it is active.',
      );
    }
    throw new Error(
      'useLink() requires an active router instance. ' +
        'Make sure you have created a router with createRouter() and it is active.',
    );
  }

  const currentRoute = useRoute() as any;
  const trackedTo =
    typeof props.to === 'function' || isSignalLike(props.to) ? signal(peekTo(props.to)) : null;

  if (trackedTo) {
    const trackedToRunner = effect(() => {
      trackedTo.value = readTo(props.to);
    });
    onDestroy(() => stop(trackedToRunner));
  }

  /**
   * Resolved route location
   */
  const route = computed<RouteLocationNormalized>(() => {
    const to = trackedTo ? trackedTo.value : readTo(props.to);

    // Safe router.resolve call with error handling
    try {
      return router.resolve(to);
    } catch (error) {
      if (__DEV__) {
        warn(`Failed to resolve route for "to" prop:`, to, `\nError:`, error);
      }
      return FALLBACK_ROUTE;
    }
  });

  /**
   * Index of the active record in the current route's matched array
   */
  const activeRecordIndex = computed(() => {
    const routeValue = route.value;
    if (!routeValue?.matched || !currentRoute?.matched) {
      return -1;
    }

    const { matched } = routeValue;
    const length = matched.length;
    const routeMatched = matched[length - 1];
    const { matched: currentMatched } = currentRoute;
    if (!routeMatched || !currentMatched.length) {
      return -1;
    }

    const index = currentMatched.findIndex((record: RouteRecord) =>
      isSameRouteRecord(routeMatched, record),
    );

    if (index > -1) return index;

    // Handle alias routes
    const parentRecordPath = getOriginalPath(matched[length - 2] as RouteRecord | undefined);
    return length > 1 &&
      getOriginalPath(routeMatched) === parentRecordPath &&
      currentMatched[currentMatched.length - 1].path !== parentRecordPath
      ? currentMatched.findIndex((record: RouteRecord) =>
          isSameRouteRecord(matched[length - 2] as RouteRecord, record),
        )
      : index;
  });

  /**
   * Whether the link is active (partial match)
   */
  const isActive = computed(() => {
    if (!currentRoute?.params || !route.value?.params) {
      return false;
    }
    return activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params);
  });

  /**
   * Whether the link is exactly active (exact match)
   */
  const isExactActive = computed(() => {
    if (!currentRoute?.matched || !currentRoute?.params || !route.value?.params) {
      return false;
    }

    const isLastMatched = activeRecordIndex.value === currentRoute.matched.length - 1;
    const hasSameParams = isSameRouteLocationParams(currentRoute.params, route.value.params);

    return activeRecordIndex.value > -1 && isLastMatched && hasSameParams;
  });

  /**
   * Navigation handler for click events
   * @param e - Mouse event
   * @returns Promise that resolves when navigation completes
   */
  function navigate(e: MouseEvent = {} as MouseEvent): Promise<void | NavigationFailure> {
    if (!guardEvent(e)) {
      return Promise.resolve();
    }

    const to = peekTo(props.to);

    // Ensure router is still available
    if (!router) {
      if (__DEV__) {
        warn('Router is not available for navigation');
      }
      return Promise.resolve();
    }

    try {
      const startNavigation = () =>
        router[props.replace ? 'replace' : 'push'](to as any).catch(noop);
      const navigation = new Promise<void | NavigationFailure>((resolve) => {
        setTimeout(() => {
          startNavigation().then(resolve);
        }, 0);
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
    } catch (error) {
      if (__DEV__) {
        warn('Navigation failed:', error);
      }
      return Promise.resolve();
    }
  }

  const href = signal(route.value?.href || '#');
  const hrefRunner = effect(() => {
    href.value = route.value?.href || '#';
  });
  onDestroy(() => stop(hrefRunner));

  return {
    route,
    href,
    isActive,
    isExactActive,
    navigate,
  };
}

function getNextPrefetchId(router: object) {
  const nextId = (routerPrefetchCounters.get(router) || 0) + 1;
  routerPrefetchCounters.set(router, nextId);
  routerLinkPrefetchId++;
  return `essor-router-prefetch-${nextId}-${routerLinkPrefetchId}`;
}

/**
 * Guards navigation events based on modifier keys and other conditions
 * @param e - Mouse event
 * @returns true if navigation should proceed
 */
function guardEvent(e: MouseEvent): boolean {
  // Don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return false;

  // Don't redirect when preventDefault called
  if (e.defaultPrevented) return false;

  // Don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return false;

  // Don't redirect if `target="_blank"`
  if (e.currentTarget) {
    const target = (e.currentTarget as Element).getAttribute('target');
    if (target && /\b_blank\b/i.test(target)) return false;
  }

  e.preventDefault();
  return true;
}

/**
 * Checks if outer params include all inner params
 * @param outer - Outer params object
 * @param inner - Inner params object
 * @returns true if all inner params are included in outer
 */
function includesParams(
  outer: { [key: string]: string | string[] },
  inner: { [key: string]: string | string[] },
): boolean {
  for (const key in inner) {
    const innerValue = inner[key];
    const outerValue = outer[key];

    if (typeof innerValue === 'string') {
      if (innerValue !== outerValue) return false;
    } else {
      // Array comparison
      if (
        !isArray(outerValue) ||
        outerValue.length !== innerValue.length ||
        innerValue.some((value, i) => value !== outerValue[i])
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Gets the original path from a route record, handling aliases
 * @param record - Route record
 * @returns Original path
 */
function getOriginalPath(record: RouteRecord | undefined): string {
  return record ? (record.aliasOf ? record.aliasOf.path : record.path) : '';
}

/**
 * Gets the link class based on prop, global, and default values
 * @param propClass - Class from prop
 * @param globalClass - Global class from router options
 * @param defaultClass - Default class
 * @returns Resolved class name
 */
const getLinkClass = (
  propClass: string | undefined,
  globalClass: string | undefined,
  defaultClass: string,
): string => propClass ?? globalClass ?? defaultClass;

/**
 * RouterLink component for declarative navigation
 * @param props - RouterLink props
 * @returns Rendered link element or custom content
 */
export const RouterLink = (props: RouterLinkProps): any => {
  const link = useLink({
    to: props.to,
    replace: props.replace,
    viewTransition: props.viewTransition,
  });

  const router = useRouter();
  const { options } = router;
  const ariaCurrent = signal<RouterLinkProps['ariaCurrentValue'] | null>(
    link.isExactActive.value ? (props.ariaCurrentValue ?? 'page') : null,
  );
  const prefetchId = getNextPrefetchId(router);

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
    preload: () => router.preloadRoute(peekTo(props.to) as any),
  });

  prefetch.onRender();
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(prefetch.onViewport);
  } else {
    Promise.resolve().then(prefetch.onViewport);
  }
  onDestroy(() => prefetch.dispose());

  /**
   * Computed class string combining user classes and active states
   */
  const buildClass = () => {
    const classes: string[] = [];

    // Add user-provided class first
    if (props.class) {
      classes.push(props.class);
    }

    // Add active class
    if (link.isActive.value) {
      classes.push(getLinkClass(props.activeClass, options?.linkActiveClass, 'router-link-active'));
    }

    // Add exact active class
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

  /**
   * Click handler that delegates to link.navigate
   */
  const handleClick = (e: MouseEvent) => {
    if (link.navigate && !props.custom) {
      link.navigate(e);
    }
  };

  // Custom rendering or default anchor element
  return props.custom
    ? typeof props.children === 'function'
      ? props.children()
      : props.children
    : createComponent(LinkComponent, {
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
