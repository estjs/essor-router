// Enhanced router options interface for better type safety
import { computed, createComponent, inject, isSignal } from 'essor';
import { isSameRouteLocationParams, isSameRouteRecord } from './location';
import { isArray, noop } from './utils';
import { warn } from './warning';
import { useRouter } from './useApi';
import { LinkComponent } from './linkComponent';
import { routeLocationKey, routerKey } from './injectionSymbols';
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
}

function useLink(props: RouterLinkProps) {
  const router = inject(routerKey);
  const currentRoute = inject(routeLocationKey);

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

  let hasPrevious = false;
  let previousTo: unknown = null;

  const route = computed<RouteLocationNormalized>(() => {
    const to = props.to;

    if (!hasPrevious || to !== previousTo) {
      previousTo = to;
      hasPrevious = true;
    }

    // Safe router.resolve call
    try {
      return router.resolve(to);
    } catch (error) {
      warn(`Failed to resolve route for "to" prop:`, to, `\nError:`, error);
      // Return a safe fallback route
      return {
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
    }
  });

  const activeRecordIndex = computed(() => {
    const routeValue = route.value;
    if (!routeValue || !routeValue.matched || !currentRoute || !currentRoute.matched) {
      return -1;
    }

    const matched = routeValue.matched;
    const currentMatched = currentRoute.matched;
    const index = currentMatched.findIndex((record: RouteRecord) =>
      isSameRouteRecord(record, matched),
    );

    if (index > -1) return index;

    const parentRecordPath = getOriginalPath(matched.at(-2) as RouteRecord | undefined);

    return matched.length > 1 &&
      getOriginalPath(matched.at(-1)) === parentRecordPath &&
      currentMatched!.at(-1)!.path !== parentRecordPath
      ? currentMatched.findIndex((record: RouteRecord) => isSameRouteRecord(record, matched.at(-2)))
      : index;
  });

  const isActive = computed(() => {
    if (!currentRoute || !currentRoute.params || !route.value || !route.value.params) {
      return false;
    }
    return activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params);
  });

  const isExactActive = computed(() => {
    if (
      !currentRoute ||
      !currentRoute.matched ||
      !currentRoute.params ||
      !route.value ||
      !route.value.params
    ) {
      return false;
    }
    return (
      activeRecordIndex.value > -1 &&
      activeRecordIndex.value === currentRoute.matched.length - 1 &&
      isSameRouteLocationParams(currentRoute.params, route.value.params)
    );
  });

  function navigate(e: MouseEvent = {} as MouseEvent): Promise<void | NavigationFailure> {
    if (guardEvent(e)) {
      const to = isSignal(props.to) ? props.to.peek() : props.to;

      // Ensure router is still available
      if (!router) {
        warn('Router is not available for navigation');
        return Promise.resolve();
      }

      try {
        if (
          props.viewTransition &&
          typeof document !== 'undefined' &&
          'startViewTransition' in document
        ) {
          return (document as any).startViewTransition(() =>
            router[props.replace ? 'replace' : 'push'](to as any).catch(noop),
          ).finished;
        }

        // avoid uncaught errors are they are logged anyway
        return router[props.replace ? 'replace' : 'push'](to as any).catch(noop);
      } catch (error) {
        warn('Navigation failed:', error);
        return Promise.resolve();
      }
    }
    return Promise.resolve();
  }

  return {
    route,
    href: computed(() => route.value?.href || '#'),
    isActive,
    isExactActive,
    navigate,
  };
}

function guardEvent(e: MouseEvent) {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
  // don't redirect when preventDefault called
  if (e.defaultPrevented) return;
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return;
  // don't redirect if `target="_blank"`
  if (e.currentTarget) {
    const target = (e.currentTarget as Element).getAttribute('target');
    if (target && /\b_blank\b/i.test(target)) return;
  }
  e.preventDefault();

  return true;
}

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
      if (
        !isArray(outerValue) ||
        outerValue.length !== innerValue.length ||
        innerValue.some((value, i) => value !== outerValue[i])
      )
        return false;
    }
  }

  return true;
}

function getOriginalPath(record: RouteRecord | undefined): string {
  return record ? (record.aliasOf ? record.aliasOf.path : record.path) : '';
}
/**
 * Utility class to get the active class based on defaults.
 * @param propClass
 * @param globalClass
 * @param defaultClass
 */
const getLinkClass = (
  propClass: string | undefined,
  globalClass: string | undefined,
  defaultClass: string,
): string => (propClass != null ? propClass : globalClass != null ? globalClass : defaultClass);

export const RouterLink = (props: RouterLinkProps) => {
  const link = useLink({
    to: props.to,
    replace: props.replace,
    viewTransition: props.viewTransition,
  });

  const { options } = useRouter();

  const elClass = computed(() => {
    const classes: string[] = [];

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
  });

  const handleClick = (e: MouseEvent) => {
    if (link.navigate && !props.custom) {
      link.navigate(e);
    }
  };

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
