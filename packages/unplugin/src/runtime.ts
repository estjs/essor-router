/**
 * Lazy component loader supported by `defineConfigRoutes()`.
 * Keep it in the `() => import('./Page')` shape so the static parser can read it.
 */
export type ConfigRouteComponent = () => Promise<unknown>;

/**
 * User-facing route config supported by `defineConfigRoutes()`.
 * Only fields consumed by the static config parser are allowed here.
 */
export interface ConfigRoute {
  path: string;
  name?: string;
  component?: ConfigRouteComponent;
  children?: readonly ConfigRoute[];
}

export type ConfigRoutes = readonly ConfigRoute[];

type PropertyOf<T, K extends PropertyKey> = K extends keyof T
  ? T[K]
  : undefined;

type ExtraKeys<Input, Allowed> = Exclude<keyof Input, keyof Allowed>;

type ExactProps<Input, Allowed> =
  ExtraKeys<Input, Allowed> extends never
    ? unknown
    : { [Key in ExtraKeys<Input, Allowed>]: never };

type StrictConfigRoute<Route> = Route extends object
  ? ExactProps<Route, ConfigRoute> & {
      path: PropertyOf<Route, 'path'> extends string
        ? PropertyOf<Route, 'path'>
        : string;
      name?: PropertyOf<Route, 'name'> extends string | undefined
        ? PropertyOf<Route, 'name'>
        : string;
      component?: PropertyOf<Route, "component"> extends
        | ConfigRouteComponent
        | undefined
        ? PropertyOf<Route, "component">
        : ConfigRouteComponent;
      children?: PropertyOf<Route, "children"> extends readonly unknown[]
        ? StrictConfigRoutes<PropertyOf<Route, "children">>
        : readonly ConfigRoute[];
    }
  : ConfigRoute;

type StrictConfigRoutes<Routes extends readonly unknown[]> =
  number extends Routes["length"]
    ? readonly StrictConfigRoute<Routes[number]>[]
    : { readonly [Index in keyof Routes]: StrictConfigRoute<Routes[Index]> };

/**
 * Zero-cost identity function. Used by the plugin to locate the config entry point
 * and to provide strict config-route type-checking for the user.
 *
 * This module is intentionally kept dependency-free so it can be imported in
 * client-side code without pulling in `unplugin` or other Node.js APIs.
 *
 * @example
 * ```ts
 * // src/routes.config.ts
 * import { defineConfigRoutes } from 'unplugin-essor-router/config'
 * export default defineConfigRoutes([
 *   { name: 'home', path: '/', component: () => import('./pages/Home') },
 * ])
 * ```
 */
export function defineConfigRoutes<const T extends readonly unknown[]>(
  routes: StrictConfigRoutes<T>,
): T {
  return routes as T;
}
