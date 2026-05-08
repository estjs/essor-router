import { type UnpluginOptions, createUnplugin } from 'unplugin';
import { join } from 'pathe';
import { createAutoExportPlugin } from './experimental/data-loaders/auto-exports';
import { createRoutesContext } from './core/context';
import {
  DEFINE_PAGE_QUERY_RE,
  MODULE_RESOLVER_PATH,
  MODULE_ROUTES_PATH,
  ROUTES_LAST_LOAD_TIME,
  VIRTUAL_PREFIX,
  asVirtualId as _asVirtualId,
  getVirtualId as _getVirtualId,
} from './core/moduleConstants';
import { DEFAULT_OPTIONS, type Options, mergeAllExtensions, resolveOptions } from './options';
import { createViteContext } from './core/vite';
import { appendExtensionListToPattern } from './core/utils';

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

export default createUnplugin<Options | undefined>((opt = {}, _meta) => {
  const options = resolveOptions(opt);
  const ctx = createRoutesContext(options);

  function getVirtualId(id: string) {
    if (options._inspect) return id;
    return _getVirtualId(id);
  }

  function asVirtualId(id: string) {
    // for inspection
    if (options._inspect) return id;
    return _asVirtualId(id);
  }

  // create the transform filter to detect `definePage()` inside page component
  const pageFilePattern = appendExtensionListToPattern(
    options.filePatterns,
    mergeAllExtensions(options),
  );

  const IDS_TO_INCLUDE = options.routesFolder.flatMap((routeOption) =>
    pageFilePattern.map((pattern) => join(routeOption.src, pattern)),
  );

  const plugins: UnpluginOptions[] = [
    {
      name: 'essor-router',
      enforce: 'pre',

      resolveId: {
        filter: {
          id: {
            include: [
              new RegExp(`^${MODULE_ROUTES_PATH}$`),
              new RegExp(`^${MODULE_RESOLVER_PATH}$`),
            ],
          },
        },
        handler(id) {
          // essor-router/auto-routes
          // essor-router/auto-resolver
          if (id === MODULE_ROUTES_PATH || id === MODULE_RESOLVER_PATH) {
            // must be a virtual module
            return asVirtualId(id);
          }
        },
      },

      async buildStart() {
        await ctx.scanPages(options.watch);
      },

      buildEnd() {
        ctx.stopWatcher();
      },

      transform: {
        filter: {
          id: {
            include: [...IDS_TO_INCLUDE, DEFINE_PAGE_QUERY_RE],
            exclude: options.exclude,
          },
        },
        handler(code, id) {
          // remove the `definePage()` from the file or isolate it
          return ctx.definePageTransform(code, id);
        },
      },

      load: {
        filter: {
          id: {
            include: [
              // virtualized ids only
              new RegExp(`^${VIRTUAL_PREFIX}${MODULE_ROUTES_PATH}$`),
              new RegExp(`^${VIRTUAL_PREFIX}${MODULE_RESOLVER_PATH}$`),
            ],
          },
        },
        handler(id) {
          // we need to use a virtual module so that vite resolves the essor-router/auto-routes
          // dependency correctly
          const resolvedId = getVirtualId(id);

          // essor-router/auto-routes
          if (resolvedId === MODULE_ROUTES_PATH) {
            ROUTES_LAST_LOAD_TIME.update();
            return ctx.generateRoutes();
          }

          // essor-router/auto-resolver
          if (resolvedId === MODULE_RESOLVER_PATH) {
            ROUTES_LAST_LOAD_TIME.update();
            return ctx.generateResolver();
          }

          return; // ok TS...
        },
      },

      // for HMR
      vite: {
        configureServer(server) {
          // Cast needed: Vite version differences in monorepo
          ctx.setServerContext(createViteContext(server as any));
        },
      },
    },
  ];

  // Experimental options
  if (options.experimental.autoExportsDataLoaders) {
    plugins.push(
      createAutoExportPlugin({
        transformFilter: {
          include: IDS_TO_INCLUDE,
          exclude: options.exclude,
        },
        loadersPathsGlobs: options.experimental.autoExportsDataLoaders,
        root: options.root,
      }),
    );
  }

  return plugins;
});

export { createRoutesContext };
export { getFileBasedRouteName, getPascalCaseRouteName } from './core/utils';
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
