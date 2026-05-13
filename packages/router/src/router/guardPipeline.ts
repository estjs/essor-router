import { toRaw } from 'essor';
import { ErrorTypes, type NavigationFailure, isNavigationFailure } from '../errors';
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
    const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
    const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);

    // Phase 1: Leaving component guards + leaveGuards + beforeLeave
    const guards = extractComponentsGuards(leavingRecords.reverse(), 'beforeLeave', to, from);
    for (const record of leavingRecords) {
      record.leaveGuards?.forEach((guard) => {
        guards.push(guardToPromiseFn(guard, to, from));
      });
      if (record.beforeLeave && Object.values(record.instances).some((instance) => !!instance)) {
        if (isArray(record.beforeLeave)) {
          for (const guard of record.beforeLeave) {
            guards.push(guardToPromiseFn(guard, to, from));
          }
        } else {
          guards.push(guardToPromiseFn(record.beforeLeave, to, from));
        }
      }
    }

    // Define phases after Phase 1 (which allocates the first guards array)
    const phases: Array<() => Lazy<any>[]> = [
      // Phase 1: leaving guards (already collected above)
      () => guards,
      // Phase 2: Global beforeEach guards
      () => beforeGuards.list().map((guard) => guardToPromiseFn(guard, to, from)),
      // Phase 3: Updating component guards + updateGuards
      () => {
        const g = extractComponentsGuards(updatingRecords, 'beforeRouteUpdate', to, from);
        for (const record of updatingRecords) {
          record.updateGuards?.forEach((guard) => {
            g.push(guardToPromiseFn(guard, to, from));
          });
        }
        return g;
      },
      // Phase 4: Entering route beforeEnter guards
      () => {
        const g: Lazy<any>[] = [];
        for (const record of enteringRecords) {
          if (record.beforeEnter) {
            if (isArray(record.beforeEnter)) {
              for (const beforeEnter of record.beforeEnter) {
                g.push(guardToPromiseFn(beforeEnter, to, from));
              }
            } else {
              g.push(guardToPromiseFn(record.beforeEnter, to, from));
            }
          }
        }
        return g;
      },
      // Phase 5: Entering component beforeRouteEnter guards
      () => {
        to.matched.forEach((record) => (record.enterCallbacks = {}));
        return extractComponentsGuards(enteringRecords, 'beforeRouteEnter', to, from);
      },
      // Phase 6: Global beforeResolve guards
      () => beforeResolveGuards.list().map((guard) => guardToPromiseFn(guard, to, from)),
    ];

    let promise: Promise<void> = Promise.resolve();
    for (const collectGuards of phases) {
      promise = promise.then(async () => {
        const phaseGuards = collectGuards();
        phaseGuards.push(canceledNavigationCheck);
        await runGuardQueue(phaseGuards);
      });
    }

    return promise
      .then(() => runRouteDataHooks(to))
      .catch((error) =>
        isNavigationFailure(error, ErrorTypes.NAVIGATION_CANCELLED) ? error : Promise.reject(error),
      );
  }

  function triggerAfterEach(
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void,
  ) {
    afterGuards.list().forEach((guard) => guard(to, from, failure));
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

  // Build identity Sets for O(1) lookups instead of O(n) .some() calls
  const toRawRecords = new Set(to.matched.map((r) => toRaw(r).aliasOf || toRaw(r)));
  const fromRawRecords = new Set(from.matched.map((r) => toRaw(r).aliasOf || toRaw(r)));

  for (const recordFrom of from.matched) {
    const rawFrom = toRaw(recordFrom).aliasOf || toRaw(recordFrom);
    if (toRawRecords.has(rawFrom)) {
      updatingRecords.push(recordFrom);
    } else {
      leavingRecords.push(recordFrom);
    }
  }

  for (const recordTo of to.matched) {
    const rawTo = toRaw(recordTo).aliasOf || toRaw(recordTo);
    if (!fromRawRecords.has(rawTo)) {
      enteringRecords.push(recordTo);
    }
  }

  return [leavingRecords, updatingRecords, enteringRecords];
}
