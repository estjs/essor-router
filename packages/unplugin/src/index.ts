import unplugin from './plugin';
import { DEFAULT_OPTIONS } from './options';

export type {
  Options,
  ResolvedOptions,
  RoutesFolder,
  RoutesFolderOption,
  RoutesFolderOptionResolved,
  ParamParsersOptions,
} from './options';
export { resolveOptions } from './options';
export type { TreeNode } from './core/tree';
export type {
  TreeNodeValue,
  TreeNodeValueStatic,
  TreeNodeValueParam,
  TreeNodeValueGroup,
} from './core/treeNodeValue';

export { DEFAULT_OPTIONS };

export { AutoExportLoaders } from './experimental/data-loaders/auto-exports';
export type { AutoExportLoadersOptions } from './experimental/data-loaders/auto-exports';

export default unplugin;

export { createRoutesContext } from './core/context';
export { getFileBasedRouteName, getPascalCaseRouteName } from './core/routeNames';
export { defineConfigRoutes } from './runtime';
export type { ConfigRoute, ConfigRouteComponent, ConfigRoutes } from './runtime';

// Route Tree and edition
export { createTreeNodeValue } from './core/treeNodeValue';
export { EditableTreeNode } from './core/extendRoutes';

/**
 * Adds useful auto imports to the AutoImport config:
 * @example
 * ```js
 * import { essorRouterAutoImports } from 'unplugin-essor-router'
 *
 * AutoImport({
 *   imports: [essorRouterAutoImports],
 * }),
 * ```
 */
export const essorRouterAutoImports: Record<
  string,
  Array<string | [importName: string, alias: string]>
> = {
  'essor-router': [
    'useRoute',
    'useRouter',
    'onBeforeRouteUpdate',
    'onBeforeRouteLeave',
    // NOTE: the typing seems broken locally, so instead we export it directly from essor-router/experimental
    // 'definePage',
  ],
  'essor-router/experimental': ['definePage', 'defineRoute'],
};
