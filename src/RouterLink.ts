import { computed, createComponent, inject, isSignal } from 'essor';
import { isSameRouteLocationParams, isSameRouteRecord } from './location';
import { isArray, noop } from './utils';
import { warn } from './warning';
import { useRouter } from './useApi';
import { LinkComponent } from './linkComponent';
import { routeLocationKey, routerKey } from './injectionSymbols';
import type { RouteRecord } from './matcher/types';
import type { NavigationFailure } from './errors';

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
}

function useLink(props: RouterLinkProps) {
  const router = inject(routerKey)!;
  const currentRoute = inject(routeLocationKey)!;

  let hasPrevious = false;
  let previousTo: unknown = null;

  const route = computed<any>(() => {
    const to = props.to;

    if (!hasPrevious || to !== previousTo) {
      if (typeof to !== 'string' && typeof to !== 'object') {
        if (hasPrevious) {
          warn(
            `Invalid value for prop "to" in useLink()\n- to:`,
            to,
            `\n- previous to:`,
            previousTo,
            `\n- props:`,
            props,
          );
        } else {
          warn(`Invalid value for prop "to" in useLink()\n- to:`, to, `\n- props:`, props);
        }
      }

      previousTo = to;
      hasPrevious = true;
    }

    return router.resolve(to);
  });

  const activeRecordIndex = computed(() => {
    const matched = route.value.matched;
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

  const isActive = computed(
    () => activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params),
  );

  const isExactActive = computed(
    () =>
      activeRecordIndex.value > -1 &&
      activeRecordIndex.value === currentRoute.matched.length - 1 &&
      isSameRouteLocationParams(currentRoute.params, route.value.params),
  );

  function navigate(e: MouseEvent = {} as MouseEvent): Promise<void | NavigationFailure> {
    if (guardEvent(e)) {
      const to = isSignal(props.to) ? (props.to.peek() as string) : props.to;

      if (
        props.viewTransition &&
        typeof document !== 'undefined' &&
        'startViewTransition' in document
      ) {
        return (document as any).startViewTransition(() =>
          router[props.replace ? 'replace' : 'push'](to).catch(noop),
        ).finished;
      }

      // avoid uncaught errors are they are logged anyway
      return router[props.replace ? 'replace' : 'push'](to).catch(noop);
    }
    return Promise.resolve();
  }

  return {
    route,
    href: route.value.href,
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

export const RouterLink = (props: RouterLinkProps & { children: unknown }) => {
  const link = useLink({
    to: props.to,
    replace: props.replace,
    viewTransition: props.viewTransition,
  });

  const { options } = useRouter();

  const elClass = computed(() => ({
    [getLinkClass(props.activeClass, options?.linkActiveClass, 'router-link-active')]:
      link.isActive,
    // [getLinkClass(
    //   props.inactiveClass,
    //   options.linkInactiveClass,
    //   'router-link-inactive'
    // )]: !link.isExactActive,
    [getLinkClass(
      props.exactActiveClass,
      options?.linkExactActiveClass,
      'router-link-exact-active',
    )]: link.isExactActive,
  }));

  const handleClick = (e: MouseEvent) => {
    if (link.navigate && !props.custom) {
      link.navigate(e);
    }
  };

  return props.custom
    ? [() => props.children]
    : createComponent(LinkComponent, {
      ariaCurrent: link.isExactActive ? props.ariaCurrentValue : null,
      href: link.href,
      onClick: handleClick,
      className: elClass.value,
      children: [() => props.children],
    });
};
