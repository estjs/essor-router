// Enhanced router options interface for better type safety
import { computed, createComponent, inject, isSignal } from 'essor';
import { isSameRouteLocationParams, isSameRouteRecord } from './location';
import { isArray, noop } from './utils';
import { warn } from './warning';
import { useRoute, useRouter } from './useApi';
import { LinkComponent } from './linkComponent';
import { routerKey } from './injectionSymbols';
import type { RouteRecord } from './matcher/types';
import type { NavigationFailure } from './errors';
import type { RouteLocationNormalized } from './types';

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
  to: string | object;
  /**
   * Calls `router.replace` instead of `router.push`.
   */
  replace?: boolean;
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
   * Children content for the link
   */
  children?: RouterLinkChildren;
  /**
   * Additional CSS class to apply to the link element
   */
  class?: string;
}

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

/**
 * Hook that provides reactive link properties and navigation handler
 * @param props - RouterLink props
 * @returns Link state and navigation handler
 */
function useLink(props: RouterLinkProps) {
  const router = inject(routerKey);
  const currentRoute = useRoute();

  // Validate router injection
  if (!router) {
    throw new Error(
      'useLink() must be used within a RouterView component. ' +
        'Make sure RouterLink is rendered inside a RouterView that provides the router context. ' +
        'Check that your router instance is properly created and provided to RouterView.',
    );
  }

  // Validate route injection
  if (!currentRoute) {
    throw new Error(
      'useLink() requires route context. ' +
        'Make sure RouterLink is rendered inside a RouterView that provides the route context. ' +
        'This error typically occurs when RouterLink is used outside of a router context.',
    );
  }

  // Cache for route resolution optimization
  let hasPrevious = false;
  let previousTo: unknown = null;

  /**
   * Resolved route location
   */
  const route = computed<RouteLocationNormalized>(() => {
    const to = props.to;

    // Update cache
    if (!hasPrevious || to !== previousTo) {
      previousTo = to;
      hasPrevious = true;
    }

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
    const { matched: currentMatched } = currentRoute;

    // Find first matching record
    const index = currentMatched.findIndex((record: RouteRecord) =>
      matched.some(r => isSameRouteRecord(record, r)),
    );

    if (index > -1) return index;

    // Handle alias routes
    const parentRecordPath = getOriginalPath(matched.at(-2) as RouteRecord | undefined);
    const lastMatched = matched.at(-1);
    const lastCurrentMatched = currentMatched.at(-1);

    // Check if we should match parent record instead
    const shouldMatchParent =
      matched.length > 1 &&
      getOriginalPath(lastMatched) === parentRecordPath &&
      lastCurrentMatched?.path !== parentRecordPath;

    return shouldMatchParent
      ? currentMatched.findIndex((record: RouteRecord) =>
          isSameRouteRecord(record, matched.at(-2) as RouteRecord),
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

    const to = isSignal(props.to) ? props.to.peek() : props.to;

    // Ensure router is still available
    if (!router) {
      if (__DEV__) {
        warn('Router is not available for navigation');
      }
      return Promise.resolve();
    }

    try {
      // Use View Transitions API if available and enabled
      if (
        props.viewTransition &&
        typeof document !== 'undefined' &&
        'startViewTransition' in document
      ) {
        return (document as any)
          .startViewTransition(() =>
            router[props.replace ? 'replace' : 'push'](to as any).catch(noop),
          )
          .finished.catch(noop);
      }

      // Standard navigation
      return router[props.replace ? 'replace' : 'push'](to as any).catch(noop);
    } catch (error) {
      if (__DEV__) {
        warn('Navigation failed:', error);
      }
      return Promise.resolve();
    }
  }

  return {
    route,
    href: computed(() => route.value?.href || '#'),
    isActive,
    isExactActive,
    navigate,
  };
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
export const RouterLink = (props: RouterLinkProps) => {
  const link = useLink({
    to: props.to,
    replace: props.replace,
    viewTransition: props.viewTransition,
  });

  const { options } = useRouter();

  /**
   * Computed class string combining user classes and active states
   */
  const elClass = computed(() => {
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
  });

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
    ? [() => props.children]
    : createComponent(LinkComponent, {
        ariaCurrent: link.isExactActive.value ? props.ariaCurrentValue : null,
        href: link.href.value,
        onClick: handleClick,
        class: elClass.value,
        children: props.children,
      });
};
