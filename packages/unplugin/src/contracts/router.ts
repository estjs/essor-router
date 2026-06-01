export type RouteMeta = Record<string | number | symbol, unknown>;

export interface RouteRecordRaw {
  path?: string;
  name?: string | number | symbol | false;
  alias?: string | string[];
  meta?: RouteMeta;
  children?: RouteRecordRaw[];
  component?: unknown;
  components?: Record<string, unknown>;
  [key: string]: any;
}
