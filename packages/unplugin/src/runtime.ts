/**
 * Zero-cost identity function. Used by the plugin to locate the config entry point
 * and to provide `RouteRecordRaw[]` type-checking for the user.
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
export function defineConfigRoutes<T extends readonly object[]>(routes: T): T {
  return routes;
}
