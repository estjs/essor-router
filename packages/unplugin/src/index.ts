import unplugin from './core/plugin';
import { DEFAULT_OPTIONS } from './core/options';

export type {
  Options,
  ResolvedOptions,
  RoutesFolder,
  RoutesFolderOption,
  RoutesFolderOptionResolved,
  ParamParsersOptions,
} from './core/options';
export { resolveOptions } from './core/options';
export type { TreeNode } from './core/tree';
export type {
  TreeNodeValue,
  TreeNodeValueStatic,
  TreeNodeValueParam,
  TreeNodeValueGroup,
} from './core/treeNodeValue';

export { DEFAULT_OPTIONS };

export { AutoExportLoaders } from './data-loaders/auto-exports';
export type { AutoExportLoadersOptions } from './data-loaders/auto-exports';

export default unplugin;

export { createRoutesContext } from './core/context';
export { getFileBasedRouteName, getPascalCaseRouteName } from './core/routeNames';
export { defineConfigRoutes } from './config';
export type { ConfigRoute, ConfigRouteComponent, ConfigRoutes } from './config';

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
    'definePage',
    'defineRoute',
  ],
};
