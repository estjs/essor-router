import { onDestroy, useInject } from 'essor';
import {
  type NavigationGuard,
  type NavigationGuardNext,
  type NavigationGuardNextCallback,
  type RawRouteComponent,
  type RouteComponent,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  type RouteLocationRaw,
  isRouteLocation,
} from './types';

import {
  ErrorTypes,
  type NavigationFailure,
  type NavigationRedirectError,
  createRouterError,
} from './errors';

import { isESModule } from './utils';
import { warn } from './warning';
import { matchedRouteKey } from './injectionSymbols';
import type { RouteRecordNormalized } from './matcher/types';

function registerGuard(
  record: RouteRecordNormalized,
  name: 'leaveGuards' | 'updateGuards',
  guard: NavigationGuard,
) {
  const removeFromList = () => {
    record[name]?.delete(guard);
  };

  onDestroy(removeFromList);

  record[name]?.add(guard);
}

/**
 * Add a navigation guard that triggers whenever the component for the current
 * location is about to be left. Similar to {@link beforeRouteLeave} but can be
 * used in any component. The guard is removed when the component is unmounted.
 *
 * @param leaveGuard - {@link NavigationGuard}
 */
export function onBeforeRouteLeave(leaveGuard: NavigationGuard) {
  const activeRecord: RouteRecordNormalized | undefined = useInject(
    matchedRouteKey,
    // to avoid warning
    {} as any,
  )!.value;

  if (!activeRecord) {
    __DEV__ &&
      warn(
        'No active route record was found when calling `onBeforeRouteLeave()`. Make sure you call this function inside a component child of <router-view>. Maybe you called it inside of App.jsx?',
      );
    return;
  }

  registerGuard(activeRecord, 'leaveGuards', leaveGuard);
}

/**
 * Add a navigation guard that triggers whenever the current location is about
 * to be updated. Similar to {@link beforeRouteUpdate} but can be used in any
 * component. The guard is removed when the component is unmounted.
 *
 * @param updateGuard - {@link NavigationGuard}
 */
export function onBeforeRouteUpdate(updateGuard: NavigationGuard) {
  const activeRecord: RouteRecordNormalized | undefined = useInject(
    matchedRouteKey,
    // to avoid warning
    {} as any,
  )!.value;
  if (!activeRecord) {
    __DEV__ &&
      warn(
        'No active route record was found when calling `onBeforeRouteUpdate()`. Make sure you call this function inside a component child of <router-view>. Maybe you called it inside of App.jsx?',
      );
    return;
  }

  registerGuard(activeRecord, 'updateGuards', updateGuard);
}

export function guardToPromiseFn(
  guard: NavigationGuard,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
): () => Promise<void>;
export function guardToPromiseFn(
  guard: NavigationGuard,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  record: RouteRecordNormalized,
  name: string,
): () => Promise<void>;
export function guardToPromiseFn(
  guard: NavigationGuard,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  record?: RouteRecordNormalized,
  name?: string,
): () => Promise<void> {
  // keep a reference to the enterCallbackArray to prevent pushing callbacks if a new navigation took place
  const enterCallbackArray =
    record &&
    // name is defined if record is because of the function overload
    (record.enterCallbacks[name!] = record.enterCallbacks[name!] || []);

  return () =>
    new Promise((resolve, reject) => {
      const next: NavigationGuardNext = (
        valid?: boolean | RouteLocationRaw | NavigationGuardNextCallback | Error,
      ) => {
        if (valid === false) {
          reject(
            createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_ABORTED, {
              from,
              to,
            }),
          );
        } else if (valid instanceof Error) {
          reject(valid);
        } else if (isRouteLocation(valid)) {
          reject(
            createRouterError<NavigationRedirectError>(ErrorTypes.NAVIGATION_GUARD_REDIRECT, {
              from: to,
              to: valid,
            }),
          );
        } else {
          if (
            enterCallbackArray &&
            // since enterCallbackArray is truthy, both record and name also are
            record!.enterCallbacks[name!] === enterCallbackArray &&
            typeof valid === 'function'
          ) {
            enterCallbackArray.push(valid);
          }
          resolve();
        }
      };

      // wrapping with Promise.resolve allows it to work with both async and sync guards
      const guardReturn = guard.call(
        record && record.instances[name!],
        to,
        from,
        __DEV__ ? canOnlyBeCalledOnce(next, to, from) : next,
      );
      let guardCall: any = Promise.resolve(guardReturn);

      if (guard.length < 3) {
        guardCall = guardCall.then(next);
      }
      if (__DEV__ && guard.length > 2) {
        const message = `The "next" callback was never called inside of ${
          guard.name ? `"${guard.name}"` : ''
        }:\n${guard.toString()}\n. If you are returning a value instead of calling "next", make sure to remove the "next" parameter from your function.`;
        if (typeof guardReturn === 'object' && 'then' in guardReturn) {
          guardCall = guardCall.then(resolvedValue => {
            // @ts-expect-error: _called is added at canOnlyBeCalledOnce
            if (!next._called) {
              warn(message);
              return Promise.reject(new Error('Invalid navigation guard'));
            }
            return resolvedValue;
          });
        } else if (
          guardReturn !== undefined && // @ts-expect-error: _called is added at canOnlyBeCalledOnce
          !next._called
        ) {
          warn(message);
          reject(new Error('Invalid navigation guard'));
          return;
        }
      }
      guardCall.catch(error => reject(error));
    });
}

function canOnlyBeCalledOnce(
  next: NavigationGuardNext,
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): NavigationGuardNext {
  let called = 0;
  return function () {
    if (called++ === 1)
      warn(
        `The "next" callback was called more than once in one navigation guard when going from "${from.fullPath}" to "${to.fullPath}". It should be called exactly one time in each navigation guard. This will fail in production.`,
      );
    // @ts-expect-error: we put it in the original one because it's easier to check
    next._called = true;
    // eslint-disable-next-line prefer-spread, prefer-rest-params
    if (called === 1) next.apply(null, arguments as any);
  };
}

type GuardType = 'beforeRouteEnter' | 'beforeRouteUpdate' | 'beforeLeave';

export function extractComponentsGuards(
  matched: RouteRecordNormalized[],
  guardType: GuardType,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
) {
  const guards: Array<() => Promise<void>> = [];

  for (const record of matched) {
    if (__DEV__ && !record.components && record.children.length === 0) {
      warn(
        `Record with path "${record.path}" is either missing a "component(s)"` +
          ` or "children" property.`,
      );
    }
    for (const name in record.components) {
      const rawComponent = record.components[name];
      if (
        __DEV__ &&
        (!rawComponent || (typeof rawComponent !== 'object' && typeof rawComponent !== 'function'))
      ) {
        warn(
          `Component "${name}" in record with path "${record.path}" is not` +
            ` a valid component. Received "${String(rawComponent)}".`,
        );
        // throw to ensure we stop here but warn to ensure the message isn't
        // missed by the user
        throw new Error('Invalid route component');
      }

      // skip update and leave guards if the route component is not mounted
      if (guardType !== 'beforeRouteEnter' && !record.instances[name]) continue;

      if (isRouteComponent(rawComponent)) {
        const guard = record[guardType];
        guard && guards.push(guardToPromiseFn(guard, to, from, record, name));
      } else {
        // start requesting the chunk already
        let componentPromise: Promise<RouteComponent | null | undefined | void> = rawComponent;
        if (__DEV__ && !('catch' in componentPromise)) {
          warn(
            `Component "${name}" in record with path "${record.path}" is a function that does not return a Promise. If you were passing a functional component, make sure to add a "displayName" to the component. This will break in production if not fixed.`,
          );
          componentPromise = Promise.resolve(componentPromise as RouteComponent);
        }

        guards.push(() =>
          componentPromise.then(resolved => {
            if (!resolved)
              return Promise.reject(
                new Error(`Couldn't resolve component "${name}" at "${record.path}"`),
              );
            const resolvedComponent = isESModule(resolved) ? resolved.default : resolved;
            // replace the function with the resolved component
            // cannot be null or undefined because we went into the for loop
            record.components![name] = resolvedComponent;
            const options = (resolvedComponent as any).__vccOpts || resolvedComponent;
            const guard = options[guardType];
            return guard && guardToPromiseFn(guard, to, from, record, name)();
          }),
        );
      }
    }
  }

  return guards;
}
export const _toString = Object.prototype.toString;

export function isAsyncFunction(fn: Function): boolean {
  return _toString.call(fn) === '[object AsyncFunction]';
}
/**
 * Allows differentiating lazy components from functional components and essor-class-component
 * @param component
 */
export function isRouteComponent(component: RawRouteComponent): component is RouteComponent {
  return typeof component === 'function' && !isAsyncFunction(component);
}

/**
 * Ensures a route is loaded, so it can be passed as o prop to `<RouterView>`.
 *
 * @param route - resolved route to load
 */
export function loadRouteLocation(
  route: RouteLocationNormalized,
): Promise<RouteLocationNormalizedLoaded> {
  return route.matched.every(record => record.redirect)
    ? Promise.reject(new Error('Cannot load a route that redirects.'))
    : Promise.all(
        route.matched.map(
          record =>
            record.components &&
            Promise.all(
              Object.keys(record.components).reduce(
                (promises, name) => {
                  const rawComponent = record.components![name];
                  if ('then' in rawComponent && !('displayName' in rawComponent)) {
                    let componentPromise: Promise<RouteComponent | null | undefined | void> =
                      rawComponent;
                    if (__DEV__ && !('catch' in componentPromise)) {
                      warn(
                        `Component "${name}" in record with path "${record.path}" is a function that does not return a Promise. If you were passing a functional component, make sure to add a "displayName" to the component. This will break in production if not fixed.`,
                      );
                      componentPromise = Promise.resolve(componentPromise as RouteComponent);
                    }

                    promises.push(
                      (componentPromise as RouteComponent).then(resolved => {
                        if (!resolved)
                          return Promise.reject(
                            new Error(
                              `Couldn't resolve component "${name}" at "${record.path}". Ensure you passed a function that returns a promise.`,
                            ),
                          );
                        const resolvedComponent = isESModule(resolved)
                          ? resolved.default
                          : resolved;

                        // replace the function with the resolved component
                        // cannot be null or undefined because we went into the for loop
                        record.components![name] = resolvedComponent;
                        return;
                      }),
                    );
                  }
                  return promises;
                },
                [] as Array<Promise<RouteComponent | null | undefined>>,
              ),
            ),
        ),
      ).then(() => route as RouteLocationNormalizedLoaded);
}
