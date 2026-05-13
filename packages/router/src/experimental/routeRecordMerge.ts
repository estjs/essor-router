import type { DefineRouteStartOptions } from './routeDefinition';
import type { RouteRecordRaw } from '../types';

type RouteRecordWithExperimentalFields = RouteRecordRaw & {
  params?: {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
  start?: DefineRouteStartOptions;
};

/**
 * Merges route records.
 *
 * @internal
 *
 * @param main - main route record
 * @param routeRecords - route records to merge
 * @returns merged route record
 */
export function _mergeRouteRecord(
  main: RouteRecordRaw,
  ...routeRecords: Partial<RouteRecordRaw>[]
): RouteRecordRaw {
  return routeRecords.reduce<RouteRecordRaw>((acc, routeRecord) => {
    const target = acc as RouteRecordWithExperimentalFields;
    const source = routeRecord as Partial<RouteRecordWithExperimentalFields>;
    const meta = Object.assign({}, target.meta, source.meta);
    const alias: string[] = ([] as string[]).concat(target.alias || [], source.alias || []);
    const start = Object.assign({}, target.start || {}, source.start || {});
    const params = {
      path: Object.assign({}, target.params?.path || {}, source.params?.path || {}),
      query: Object.assign({}, target.params?.query || {}, source.params?.query || {}),
    };

    // TODO: other nested properties
    // const props = Object.assign({}, acc.props, routeRecord.props)

    Object.assign(acc, routeRecord);
    acc.meta = meta;
    acc.alias = alias;
    target.start = start;
    target.params = params;
    return acc;
  }, main);
}
