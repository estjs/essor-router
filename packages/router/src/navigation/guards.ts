import { inject, onDestroy } from 'essor';
import { isFunction, isObject } from '@estjs/shared';
import {
  type NavigationGuard,
  type NavigationGuardNext,
  type NavigationGuardNextCallback,
  type NavigationGuardReturn,
  type RawRouteComponent,
  type RouteComponent,
  type RouteComponentModule,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  type RouteLocationRaw,
  isRouteComponentLoader,
  isRouteLocation,
} from '../types';

import {
  ErrorTypes,
  type NavigationFailure,
  type NavigationRedirectError,
  createRouterError,
} from '../core/errors';
import { isAsyncFunction, isESModule, isPromiseLike } from '../utils';
import { warn } from '../core/warning';
import { matchedRouteKey } from '../core/injectionSymbols';
import type { RouteRecordNormalized } from '../matcher/types';

type RouteComponentResolverInput =
  | RawRouteComponent
  | Promise<RouteComponentModule | null | undefined | void>;

function registerGuard(
  record: RouteRecordNormalized,
  name: 'leaveGuards' | 'updateGuards',
  guard: NavigationGuard,
) {
  // Lazy-initialize the guard set if needed
  if (!record[name]) {
    record[name] = new Set();
  }

  const removeFromList = () => {
    record[name]?.delete(guard);
  };

  try {
    onDestroy(removeFromList);
  } catch (error) {
    if (__DEV__) {
      warn(
        `Cannot register "${name}" outside of an active component scope. Make sure this guard is created during component setup.`,
        error,
      );
    }
    return;
  }

  record[name].add(guard);
}

/**
 * Add a navigation guard that triggers whenever the component for the current
 * location is about to be left. Similar to {@link beforeRouteLeave} but can be
 * used in any component. The guard is removed when the component is unmounted.
 *
 * @param leaveGuard - {@link NavigationGuard}
 */
export function onBeforeRouteLeave(leaveGuard: NavigationGuard) {
  const activeRecord: RouteRecordNormalized | undefined = inject(matchedRouteKey)!.value;
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
  const activeRecord: RouteRecordNormalized | undefined = inject(matchedRouteKey)!.value;
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
            isFunction(valid)
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
      let guardCall: Promise<NavigationGuardReturn> = Promise.resolve(guardReturn);

      if (guard.length < 3) {
        guardCall = guardCall.then(next);
      }
      if (__DEV__ && guard.length > 2) {
        const message = `The "next" callback was never called inside of ${
          guard.name ? `"${guard.name}"` : ''
        }:\n${guard.toString()}\n. If you are returning a value instead of calling "next", make sure to remove the "next" parameter from your function.`;
        if (isPromiseLike(guardReturn)) {
          guardCall = guardCall.then((resolvedValue: NavigationGuardReturn) => {
            // @ts-expect-error: _called is added at canOnlyBeCalledOnce
            if (!next._called) {
              warn(message);
              next(resolvedValue as any);
            }
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
      guardCall.catch((error: Error) => reject(error));
    });
}

function normalizeResolvedRouteComponent(resolved: RouteComponentModule): RouteComponent {
  return isESModule(resolved) ? resolved.default : resolved;
}

function createResolveComponentError(name: string, path: string): Error {
  return new Error(
    `Couldn't resolve component "${name}" at "${path}". Ensure you passed a function that returns a promise.`,
  );
}

export function resolveRouteComponent(
  rawComponent: RouteComponentResolverInput,
  routePath: string,
  name: string,
): RouteComponent | Promise<RouteComponent> {
  const normalizeOrThrow = (
    resolved: RouteComponentModule | null | undefined | void,
  ): RouteComponent => {
    if (!resolved) {
      throw createResolveComponentError(name, routePath);
    }

    return normalizeResolvedRouteComponent(resolved);
  };

  if (isRouteComponentLoader(rawComponent)) {
    return Promise.resolve(rawComponent()).then(normalizeOrThrow);
  }

  if (isFunction(rawComponent) && isAsyncFunction(rawComponent)) {
    return Promise.resolve(
      (rawComponent as () => Promise<RouteComponentModule | null | undefined | void>)(),
    ).then(normalizeOrThrow);
  }

  if (isPromiseLike(rawComponent)) {
    return Promise.resolve(rawComponent).then(normalizeOrThrow);
  }

  return normalizeResolvedRouteComponent(rawComponent as RouteComponentModule);
}

function canOnlyBeCalledOnce(
  next: NavigationGuardNext,
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): NavigationGuardNext {
  let called = 0;
  return function (...args: any[]) {
    if (called++ === 1)
      warn(
        `The "next" callback was called more than once in one navigation guard when going from "${from.fullPath}" to "${to.fullPath}". It should be called exactly one time in each navigation guard. This will fail in production.`,
      );
    // @ts-expect-error: we put it in the original one because it's easier to check
    next._called = true;
    if (called === 1) (next as any)(...args);
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
      if (__DEV__ && (!rawComponent || (!isObject(rawComponent) && !isFunction(rawComponent)))) {
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
        const option =
          (rawComponent as RouteComponent & { options?: Record<string, unknown> }).options ||
          rawComponent;
        const guard = option[guardType];
        guard && guards.push(guardToPromiseFn(guard, to, from, record, name));
      } else {
        guards.push(() =>
          Promise.resolve(
            resolveRouteComponent(rawComponent as RouteComponentResolverInput, record.path, name),
          ).then((resolvedComponent) => {
            // replace the function with the resolved component
            // cannot be null or undefined because we went into the for loop
            record.components![name] = resolvedComponent;
            const option =
              (resolvedComponent as RouteComponent & { options?: Record<string, unknown> })
                .options || resolvedComponent;
            const guard = (option as Record<string, NavigationGuard | undefined>)[guardType];
            return guard ? guardToPromiseFn(guard, to, from, record, name)() : undefined;
          }),
        );
      }
    }
  }

  return guards;
}

/**
 * Allows differentiating lazy components from functional components and essor-class-component
 * @param component
 */
export function isRouteComponent(component: RawRouteComponent): component is RouteComponent {
  return isFunction(component) && !isAsyncFunction(component) && !isRouteComponentLoader(component);
}

/**
 * Ensures a route is loaded, so it can be passed as o prop to `<RouterView>`.
 *
 * @param route - resolved route to load
 */
export function loadRouteLocation(
  route: RouteLocationNormalized,
): Promise<RouteLocationNormalizedLoaded> {
  return route.matched.every((record) => record.redirect)
    ? Promise.reject(new Error('Cannot load a route that redirects.'))
    : Promise.all(
        route.matched.map(
          (record) =>
            record.components &&
            Promise.all(
              Object.keys(record.components).reduce(
                (promises, name) => {
                  const rawComponent = record.components![name];
                  const resolved = resolveRouteComponent(
                    rawComponent as RouteComponentResolverInput,
                    record.path,
                    name,
                  );

                  if (isPromiseLike(resolved)) {
                    promises.push(
                      resolved.then((resolvedComponent) => {
                        record.components![name] = resolvedComponent;
                        return;
                      }),
                    );
                  } else {
                    record.components![name] = resolved;
                  }
                  return promises;
                },
                [] as Array<Promise<void>>,
              ),
            ),
        ),
      ).then(() => route as RouteLocationNormalizedLoaded);
}
