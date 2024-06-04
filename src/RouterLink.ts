import { h, isSignal, template, useComputed } from 'essor';
import { isSameRouteLocationParams, isSameRouteRecord } from './location';
import { isArray, noop } from './utils';
import { warn } from './warning';
import { routerStore } from './store';
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
   * using `v-slot` to create a custom RouterLink
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
}
function useLink(props: RouterLinkProps) {
  const router = routerStore.getRouter.value as any;
  const currentRoute = routerStore.getCurrentRouter.value as unknown as any;

  let hasPrevious = false;
  let previousTo: unknown = null;

  const route = useComputed<any>(() => {
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

  const activeRecordIndex = useComputed(() => {
    const matched = route.value.matched;
    const currentMatched = currentRoute.matched;
    const index = currentMatched.findIndex((record: RouteRecord) =>
      isSameRouteRecord(record, matched),
    );

    if (index > -1) return index;

    const parentRecordPath = getOriginalPath(matched.at(-2) as RouteRecord | undefined);

    return matched.length > 1 &&
      getOriginalPath(matched.at(-1)) === parentRecordPath &&
      currentMatched.at(-1).path !== parentRecordPath
      ? currentMatched.findIndex((record: RouteRecord) => isSameRouteRecord(record, matched.at(-2)))
      : index;
  });

  const isActive = useComputed(
    () => activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params),
  );

  const isExactActive = useComputed(
    () =>
      activeRecordIndex.value > -1 &&
      activeRecordIndex.value === currentRoute.matched.length - 1 &&
      isSameRouteLocationParams(currentRoute.params, route.value.params),
  );

  function navigate(e: MouseEvent = {} as MouseEvent): Promise<void | NavigationFailure> {
    if (guardEvent(e)) {
      const to = isSignal(props.to) ? props.to.peek() : props.to;
      // avoid uncaught errors are they are logged anyway
      return router[props.replace ? 'replace' : 'push'](to).catch(noop);
    }
    return Promise.resolve();
  }

  return {
    route,
    href: route.value.pathname,
    isActive,
    isExactActive,
    navigate,
  };
}

function guardEvent(e) {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
  // don't redirect when preventDefault called
  if (e.defaultPrevented) return;
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return;
  // don't redirect if `target="_blank"`
  if (e.currentTarget && e.currentTarget.getAttribute) {
    const target = e.currentTarget.getAttribute('target');
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

export const RouterLink = props => {
  const link = useLink({ to: props.to, replace: props.replace });

  const { options } = routerStore.getRouter as any;
  const elClass = useComputed(() => ({
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

  const handleClick = e => {
    if (link.navigate && !props.custom) {
      link.navigate(e);
    }
  };

  return props.custom
    ? h(template(''), {
        '0': {
          children: [[() => props.children, null]],
        },
      })
    : h(template('<a></a>'), {
        '1': {
          ariaCurrent: link.isExactActive ? props.ariaCurrentValue : null,
          href: link.href,
          onClick: handleClick,
          class: elClass.value,
          children: [[() => props.children, null]],
        },
      });
};
