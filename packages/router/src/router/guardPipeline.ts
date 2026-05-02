import { toRaw } from 'essor';
import { ErrorTypes, type NavigationFailure, isNavigationFailure } from '../errors';
import { isSameRouteRecord } from '../location';
import { extractComponentsGuards, guardToPromiseFn } from '../navigationGuards';
import { isArray } from '../utils';
import { useCallbacks } from '../utils/callbacks';
import type {
  Lazy,
  NavigationGuardWithThis,
  NavigationHookAfter,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from '../types';
import type { RouteRecordNormalized } from '../matcher/types';

export interface GuardPipeline {
  beforeGuards: ReturnType<typeof useCallbacks<NavigationGuardWithThis<undefined>>>;
  beforeResolveGuards: ReturnType<typeof useCallbacks<NavigationGuardWithThis<undefined>>>;
  afterGuards: ReturnType<typeof useCallbacks<NavigationHookAfter>>;
  navigate: (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    checkCanceledNavigationAndReject: (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
    ) => Promise<void>,
    runRouteDataHooks: (to: RouteLocationNormalized) => Promise<void>,
  ) => Promise<any>;
  triggerAfterEach: (
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void,
  ) => void;
}

export function createGuardPipeline(): GuardPipeline {
  const beforeGuards = useCallbacks<NavigationGuardWithThis<undefined>>();
  const beforeResolveGuards = useCallbacks<NavigationGuardWithThis<undefined>>();
  const afterGuards = useCallbacks<NavigationHookAfter>();

  function navigate(
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    checkCanceledNavigationAndReject: (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
    ) => Promise<void>,
    runRouteDataHooks: (to: RouteLocationNormalized) => Promise<void>,
  ) {
    let guards: Lazy<any>[];
    const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);

    guards = extractComponentsGuards(leavingRecords.reverse(), 'beforeLeave', to, from);
    for (const record of leavingRecords) {
      record.leaveGuards.forEach(guard => {
        guards.push(guardToPromiseFn(guard, to, from));
      });
      if (record.beforeLeave && Object.values(record.instances).some(instance => !!instance)) {
        if (Array.isArray(record.beforeLeave)) {
          for (const guard of record.beforeLeave) {
            guards.push(guardToPromiseFn(guard, to, from));
          }
        } else {
          guards.push(guardToPromiseFn(record.beforeLeave, to, from));
        }
      }
    }

    const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
    guards.push(canceledNavigationCheck);

    return runGuardQueue(guards)
      .then(() => {
        guards = [];
        for (const guard of beforeGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      })
      .then(() => {
        guards = extractComponentsGuards(updatingRecords, 'beforeRouteUpdate', to, from);
        for (const record of updatingRecords) {
          record.updateGuards.forEach(guard => {
            guards.push(guardToPromiseFn(guard, to, from));
          });
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      })
      .then(() => {
        guards = [];
        for (const record of enteringRecords) {
          if (record.beforeEnter) {
            if (isArray(record.beforeEnter)) {
              for (const beforeEnter of record.beforeEnter) {
                guards.push(guardToPromiseFn(beforeEnter, to, from));
              }
            } else {
              guards.push(guardToPromiseFn(record.beforeEnter, to, from));
            }
          }
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      })
      .then(() => {
        to.matched.forEach(record => (record.enterCallbacks = {}));
        guards = extractComponentsGuards(enteringRecords, 'beforeRouteEnter', to, from);
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      })
      .then(() => {
        guards = [];
        for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      })
      .then(() => runRouteDataHooks(to))
      .catch(error =>
        isNavigationFailure(error, ErrorTypes.NAVIGATION_CANCELLED) ? error : Promise.reject(error),
      );
  }

  function triggerAfterEach(
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void,
  ) {
    afterGuards.list().forEach(guard => guard(to, from, failure));
  }

  return {
    beforeGuards,
    beforeResolveGuards,
    afterGuards,
    navigate,
    triggerAfterEach,
  };
}

function runGuardQueue(guards: Lazy<any>[]): Promise<void> {
  return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve());
}

function extractChangingRecords(to: RouteLocationNormalized, from: RouteLocationNormalizedLoaded) {
  const leavingRecords: RouteRecordNormalized[] = [];
  const updatingRecords: RouteRecordNormalized[] = [];
  const enteringRecords: RouteRecordNormalized[] = [];

  const len = Math.max(from.matched.length, to.matched.length);
  for (let i = 0; i < len; i++) {
    const recordFrom = from.matched[i];
    if (recordFrom) {
      if (to.matched.some(record => isSameRouteRecord(toRaw(record), toRaw(recordFrom)))) {
        updatingRecords.push(recordFrom);
      } else {
        leavingRecords.push(recordFrom);
      }
    }
    const recordTo = to.matched[i];
    if (
      recordTo &&
      !from.matched.some(record => isSameRouteRecord(toRaw(record), toRaw(recordTo)))
    ) {
      enteringRecords.push(recordTo);
    }
  }

  return [leavingRecords, updatingRecords, enteringRecords];
}
