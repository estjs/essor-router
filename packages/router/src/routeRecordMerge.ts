import type { DefineRouteStartOptions } from './routeDefinition';
import type { RouteRecordRaw } from './types';

type RouteRecordWithStableFields = RouteRecordRaw & {
  params?: {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
  start?: DefineRouteStartOptions;
};

/**
 * Merges route records extracted from `definePage()` calls into a main route
 * record produced by file-based routing.
 *
 * Merge semantics — applied in order:
 * 1. Every field from `source` overwrites the same field on `acc` (shallow).
 * 2. The following fields are then deep-merged instead, so values from earlier
 *    records survive when the later record only specifies a subset:
 *    - `meta`        (object spread)
 *    - `alias`       (array concat)
 *    - `start`       (object spread)
 *    - `params.path` (object spread)
 *    - `params.query`(object spread)
 *
 * Anything outside that list takes a "last wins" semantics.
 *
 * Prefixed with `_` because it is intended to be called by generated code
 * from `unplugin-essor-router`, not by user code directly.
 */
export function _mergeRouteRecord(
  main: RouteRecordRaw,
  ...routeRecords: Partial<RouteRecordRaw>[]
): RouteRecordRaw {
  return routeRecords.reduce<RouteRecordRaw>((acc, routeRecord) => {
    if (!routeRecord) return acc;

    const target = acc as RouteRecordWithStableFields;
    const source = routeRecord as Partial<RouteRecordWithStableFields>;

    // Snapshot fields that need deep merge BEFORE the shallow overwrite below.
    const mergedMeta = Object.assign({}, target.meta, source.meta);
    const mergedAlias = ([] as string[]).concat(target.alias || [], source.alias || []);
    const mergedStart = Object.assign({}, target.start, source.start);
    const mergedParams = {
      path: Object.assign({}, target.params?.path, source.params?.path),
      query: Object.assign({}, target.params?.query, source.params?.query),
    };

    // Last-wins for every other field.
    Object.assign(acc, routeRecord);

    // Restore the deep-merged fields, overwriting the just-assigned source copy.
    acc.meta = mergedMeta;
    if (mergedAlias.length > 0) acc.alias = mergedAlias;
    target.start = mergedStart;
    target.params = mergedParams;

    return acc;
  }, main);
}
