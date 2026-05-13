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
import { type Options, mergeAllExtensions, resolveOptions } from './options';
import { createViteContext } from './core/vite';
import { appendExtensionListToPattern } from './core/utils';

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
        return ctx.stopWatcher();
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
