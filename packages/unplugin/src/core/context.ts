import { type Stats, promises as fs } from 'node:fs';
import { glob } from 'tinyglobby';
import { dirname, parse as parsePathe, relative, resolve } from 'pathe';
import { type FSWatcher, watch as fsWatch } from 'chokidar';
import picomatch from 'picomatch';
import { camelCase, isFunction } from '@estjs/shared';
import { EditableTreeNode } from './extendRoutes';
import { definePageTransform, extractDefinePageInfo } from './definePage';
import {
  type HandlerContext,
  RoutesFolderWatcher,
  resolveFolderOptions,
} from './RoutesFolderWatcher';
import { ImportsMap, asRoutePath, logTree, throttle } from './utils';
import { PrefixTree, type TreeNode } from './tree';
import { loadConfigRoutes } from './configSource';
import type { ParamParsersMap } from '../codegen/generateParamParsers';
import type { ResolvedOptions, ServerContext } from '../options';

export function createRoutesContext(options: ResolvedOptions) {
  const { dts: preferDTS, root, routesFolder } = options;
  const dts =
    preferDTS === false
      ? false
      : preferDTS === true
        ? resolve(root, 'typed-router.d.ts')
        : resolve(root, preferDTS);
  const dtsDir = dts ? dirname(dts) : root;

  const routeTree = new PrefixTree(options);
  const editableRoutes = new EditableTreeNode(routeTree);

  const logger = new Proxy(console, {
    get(target, prop) {
      const res = Reflect.get(target, prop);
      if (isFunction(res)) {
        return options.logs ? res : () => { };
      }
      return res;
    },
  });

  // populated by the initial scan pages
  const watchers: Array<FSWatcher | RoutesFolderWatcher> = [];
  const paramParsersMap: ParamParsersMap = new Map();
  const definePageFileFlags = new Map<string, boolean>();

  async function scanPages(startWatchers = true) {
    if (options.extensions.length < 1) {
      throw new Error('"extensions" cannot be empty. Please specify at least one extension.');
    }

    // initial scan was already done
    if (watchers.length > 0) {
      return;
    }

    // ── Config-based routing ─────────────────────────────────────────────────
    if (options.mode === 'config') {
      loadConfigRoutes(routeTree, options);

      if (startWatchers && options.watch) {
        watchConfigFile(options.configRoutes!);
      }

      for (const route of editableRoutes) {
        await options.extendRoute?.(route);
      }

      await _writeConfigFiles();
      return;
    }

    // ── File-based routing (existing logic, unchanged) ────────────────────────
    const PARAM_PARSER_GLOB = '*.{ts,js}';
    const isParamParserMatch = picomatch(PARAM_PARSER_GLOB);

    // get the initial list of pages
    await Promise.all([
      ...routesFolder
        .map((folder) => resolveFolderOptions(options, folder))
        .map((folder) => {
          if (startWatchers) {
            watchers.push(setupWatcher(new RoutesFolderWatcher(folder)));
          }

          // the ignore option must be relative to cwd or absolute
          const ignorePattern = folder.exclude.map((f) =>
            // if it starts with ** then it will work as expected
            f.startsWith('**') ? f : relative(folder.src, f),
          );

          return glob(folder.pattern, {
            cwd: folder.src,
            // TODO: do they return the symbolic link path or the original file?
            // followSymbolicLinks: false,
            ignore: ignorePattern,
            expandDirectories: false,
          }).then((files) =>
            Promise.all(
              files
                // ensure consistent files in Windows/Unix and absolute paths
                .map((file) => resolve(folder.src, file))
                .map((file) =>
                  addPage({
                    routePath: asRoutePath(folder, file),
                    filePath: file,
                  }),
                ),
            ),
          );
        }),
      ...(options.experimental.paramParsers?.dir.map((folder) => {
        if (startWatchers) {
          watchers.push(
            setupParamParserWatcher(
              fsWatch('.', {
                cwd: folder,
                ignoreInitial: true,
                ignorePermissionErrors: true,
                ignored: (filePath: string, stats?: Stats) => {
                  // let folders pass, they are ignored by the glob pattern
                  if (!stats || stats.isDirectory()) {
                    return false;
                  }

                  return !isParamParserMatch(relative(folder, filePath));
                },
              }),
              folder,
            ),
          );
        }

        return glob(PARAM_PARSER_GLOB, {
          cwd: folder,
          onlyFiles: true,
          expandDirectories: false,
        }).then((paramParserFiles) => {
          for (const file of paramParserFiles) {
            const fileName = parsePathe(file).name;
            const name = camelCase(fileName);
            // TODO: could be simplified to only one import that starts with / for vite
            const absolutePath = resolve(folder, file);
            paramParsersMap.set(fileName, {
              name,
              typeName: `Param_${name}`,
              absolutePath,
              relativePath: relative(dtsDir, absolutePath),
            });
          }
          logger.log(
            'Parsed param parsers',
            [...paramParsersMap].map((p) => p[0]),
          );
        });
      }) || []),
    ]);

    for (const route of editableRoutes) {
      await options.extendRoute?.(route);
    }

    // immediately write the files without the throttle
    await _writeConfigFiles();
  }

  /**
   * Watches the config-based routes file for changes and triggers a full
   * tree reload + DTS / virtual-module update when the file is modified.
   * Only used when `options.mode === 'config'`.
   */
  function watchConfigFile(configPath: string) {
    const watcher = fsWatch(configPath, { ignoreInitial: true });

    watcher.on('change', async () => {
      logger.log(`Config routes file changed: ${configPath}`);
      // reset the tree so we can rebuild it from scratch
      routeTree.children.clear();
      loadConfigRoutes(routeTree, options);
      await _writeConfigFiles();
      server?.updateRoutes();
    });

    watchers.push(watcher);
  }

  async function writeRouteInfoToNode(node: TreeNode, filePath: string) {
    const content = await fs.readFile(filePath, 'utf8');
    const definedPageInfo = extractDefinePageInfo(content, filePath);
    definePageFileFlags.set(filePath, definedPageInfo?.hasRemainingProperties ?? false);
    node.setCustomRouteBlock(filePath, {
      ...definedPageInfo,
    });
    node.hasDefinePage = Array.from(node.value.components.values()).some((componentPath) =>
      definePageFileFlags.get(componentPath),
    );

    server?.invalidatePage(filePath);
  }

  async function addPage({ filePath, routePath }: HandlerContext, triggerExtendRoute = false) {
    logger.log(`added "${routePath}" for "${filePath}"`);
    const node = routeTree.insert(routePath, filePath);
    await writeRouteInfoToNode(node, filePath);

    if (triggerExtendRoute) {
      await options.extendRoute?.(new EditableTreeNode(node));
    }

    server?.updateRoutes();
  }

  async function updatePage({ filePath, routePath }: HandlerContext) {
    logger.log(`updated "${routePath}" for "${filePath}"`);
    const node = routeTree.getChild(filePath);
    if (!node) {
      logger.warn(`Cannot update "${filePath}": Not found.`);
      return;
    }
    await writeRouteInfoToNode(node, filePath);
    await options.extendRoute?.(new EditableTreeNode(node));
    // no need to manually trigger the update of essor-router/auto-routes because
    // the change of the essor file will trigger HMR
    // server?.invalidate(filePath)
    server?.updateRoutes();
  }

  function removePage({ filePath, routePath }: HandlerContext) {
    logger.log(`remove "${routePath}" for "${filePath}"`);
    const affectedNode = routeTree.getChild(filePath);
    definePageFileFlags.delete(filePath);
    // eslint-disable-next-line unicorn/prefer-dom-node-remove
    routeTree.removeChild(filePath);
    if (affectedNode) {
      affectedNode.hasDefinePage = Array.from(affectedNode.value.components.values()).some(
        (componentPath) => definePageFileFlags.get(componentPath),
      );
    }
    server?.updateRoutes();
  }

  function removePagesUnderDir(dirPath: string) {
    const normalize = (value: string) => value.replaceAll('\\', '/').replace(/\/+$/, '');
    const normalizedDir = normalize(dirPath);
    let changed = false;

    for (const filePath of Array.from(routeTree.map.keys())) {
      const normalizedFile = normalize(filePath);
      if (normalizedFile === normalizedDir || normalizedFile.startsWith(`${normalizedDir}/`)) {
        const affectedNode = routeTree.getChild(filePath);
        definePageFileFlags.delete(filePath);
        routeTree.removeChild(filePath);
        if (affectedNode) {
          affectedNode.hasDefinePage = Array.from(affectedNode.value.components.values()).some(
            (componentPath) => definePageFileFlags.get(componentPath),
          );
        }
        changed = true;
      }
    }

    if (changed) {
      logger.log(`remove dir "${dirPath}"`);
      server?.updateRoutes();
    }
  }

  function setupParamParserWatcher(watcher: FSWatcher, cwd: string) {
    logger.log(`🤖 Scanning param parsers in ${cwd}`);
    return watcher
      .on('add', (file) => {
        const fileName = parsePathe(file).name;
        const name = camelCase(fileName);
        const absolutePath = resolve(cwd, file);
        paramParsersMap.set(fileName, {
          name,
          typeName: `Param_${name}`,
          absolutePath,
          relativePath: relative(dtsDir, absolutePath),
        });
        writeConfigFiles();
        server?.updateRoutes();
      })
      .on('unlink', (file) => {
        paramParsersMap.delete(parsePathe(file).name);
        writeConfigFiles();
        server?.updateRoutes();
      });
  }

  function setupWatcher(watcher: RoutesFolderWatcher) {
    logger.log(`🤖 Scanning files in ${watcher.src}`);

    return watcher
      .on('change', async (ctx) => {
        await updatePage(ctx);
        writeConfigFiles();
      })
      .on('add', async (ctx) => {
        await addPage(ctx, true);
        writeConfigFiles();
      })
      .on('unlink', (ctx) => {
        removePage(ctx);
        writeConfigFiles();
      })
      .on('unlinkDir', (ctx) => {
        removePagesUnderDir(ctx.filePath);
        writeConfigFiles();
      });

    // TODO: handle folder removal: apparently chokidar only emits a raw event when deleting a folder instead of the
    // unlinkDir event
  }

  /**
   * Generates the shared handleHotUpdate function snippet used for HMR.
   */
  function hmrHandleHotUpdate(): string {
    return `export function handleHotUpdate(_router, _hotUpdateCallback) {
  if (import.meta.hot) {
    import.meta.hot.data.router = _router
    import.meta.hot.data.router_hotUpdateCallback = _hotUpdateCallback
  }
}`;
  }

  /**
   * Generates the shared HMR accept snippet with the given module-specific reload logic.
   * @param reloadModuleName - the name to use in the error message ('routes' or 'resolver')
   * @param reloadBody - the module-specific reload logic to run inside the accept callback
   */
  function hmrAccept(reloadModuleName: string, reloadBody: string): string {
    return `if (import.meta.hot) {
  import.meta.hot.accept((mod) => {
    const router = import.meta.hot.data.router
    if (!router) {
      import.meta.hot.invalidate('[essor-router:HMR] Cannot replace the ${reloadModuleName} because there is no active router. Reloading.')
      return
    }
    ${reloadBody}
    // call the hotUpdateCallback for custom updates
    import.meta.hot.data.router_hotUpdateCallback?.(mod.${reloadModuleName === 'routes' ? 'routes' : 'resolver'})
    const route = router.currentRoute.value
    router.replace({
      ${reloadModuleName === 'routes'
        ? `...route,
      // NOTE: we should be able to just do ...route but the router
      // currently skips resolving and can give errors with renamed routes
      // so we explicitly set remove matched and name
      name: undefined,
      matched: undefined,`
        : `path: route.path,
      query: route.query,
      hash: route.hash,`
      }
      force: true
    })
  })
}`;
  }

  async function generateResolver() {
    const [
      { generateRouteResolver },
      { generateDuplicatedRoutesWarnings },
      { generateAliasWarnings },
      { collectMissingParamParsers },
    ] = await Promise.all([
      import('../codegen/generateRouteResolver'),
      import('../codegen/generateDuplicateRoutesWarnings'),
      import('../codegen/generateAliasWarnings'),
      import('../codegen/generateParamParsers'),
    ]);

    const importsMap = new ImportsMap();
    const resolverCode = generateRouteResolver(routeTree, options, importsMap, paramParsersMap);

    let imports = importsMap.toString();
    if (imports) imports += '\n';

    const missingParsers = collectMissingParamParsers(routeTree, paramParsersMap);
    let missingParserErrors = '';
    if (missingParsers.length > 0) {
      missingParserErrors = `\n${missingParsers
        .map(
          ({ parser, routePath, filePaths }) =>
            `console.error('[essor-router] Parameter parser "${parser}" not found for route "${routePath}". File: ${filePaths.join(', ')}')`,
        )
        .join('\n')}\n`;
    }

    const routeDupsWarns = generateDuplicatedRoutesWarnings(routeTree);
    const aliasWarns = generateAliasWarnings(routeTree);

    return `${imports}${routeDupsWarns}\n${aliasWarns}\n${missingParserErrors}${resolverCode}\n${hmrHandleHotUpdate()}\n${hmrAccept(
      'resolver',
      'router._hmrReplaceResolver(mod.resolver)',
    )}`;
  }

  async function generateRoutes() {
    const [{ generateRouteRecords }, { generateDuplicatedRoutesWarnings }] = await Promise.all([
      import('../codegen/generateRouteRecords'),
      import('../codegen/generateDuplicateRoutesWarnings'),
    ]);

    const importsMap = new ImportsMap();
    const routeList = `export const routes = ${generateRouteRecords(
      routeTree,
      options,
      importsMap,
    )}\n`;

    let imports = importsMap.toString();
    if (imports) imports += '\n';

    const routeDupsWarns = generateDuplicatedRoutesWarnings(routeTree);

    return `${imports}${routeDupsWarns}\n${routeList}${hmrHandleHotUpdate()}\n${hmrAccept(
      'routes',
      `router.clearRoutes()
    for (const route of mod.routes) {
      router.addRoute(route)
    }`,
    )}\n`;
  }

  async function generateDTS() {
    const [
      { generateRouteNamedMap },
      { generateRouteTreeMap },
      { generateRouteFileInfoMap },
      { generateDTS: _generateDTS },
      {
        generateParamParsersTypesDeclarations,
        generateParamParserCustomType,
        warnMissingParamParsers,
      },
    ] = await Promise.all([
      import('../codegen/generateRouteMap'),
      import('../codegen/generateRouteTree'),
      import('../codegen/generateRouteFileInfoMap'),
      import('../codegen/generateDTS'),
      import('../codegen/generateParamParsers'),
    ]);

    if (options.experimental.paramParsers?.dir.length) {
      warnMissingParamParsers(routeTree, paramParsersMap);
    }

    return _generateDTS({
      routeNamedMap: generateRouteNamedMap(routeTree, options, paramParsersMap),
      routeTreeMap: generateRouteTreeMap(routeTree),
      routeFileInfoMap: generateRouteFileInfoMap(routeTree, { root }),
      paramsTypesDeclaration: generateParamParsersTypesDeclarations(paramParsersMap),
      customParamsType: generateParamParserCustomType(paramParsersMap),
    });
  }

  let lastDTS: string | undefined;
  async function _writeConfigFiles() {
    logger.time('writeConfigFiles');

    if (options.beforeWriteFiles) {
      await options.beforeWriteFiles(editableRoutes);
      logger.timeLog('writeConfigFiles', 'beforeWriteFiles()');
    }

    logTree(routeTree, logger.log);
    if (dts) {
      const content = await generateDTS();
      if (lastDTS !== content) {
        await fs.mkdir(dirname(dts), { recursive: true });
        await fs.writeFile(dts, content, 'utf-8');
        logger.timeLog('writeConfigFiles', 'wrote dts file');
        lastDTS = content;
        // TODO: only update routes if routes changed (this includes definePage changes)
        // but do not update routes if only the component want updated
        // currently, this doesn't trigger if definePage meta properties changed
        server?.updateRoutes();
      }
    }
    logger.timeEnd('writeConfigFiles');
  }

  // debounce of 100ms + throttle of 500ms
  // => Initially wait 100ms (renames are actually remove and add but we rather write once) (debounce)
  // subsequent calls after the first execution will wait 500ms-100ms to execute (throttling)
  const writeConfigFiles = throttle(_writeConfigFiles, 500, 100);

  function stopWatcher() {
    if (watchers.length) {
      logger.log('🛑 stopping watcher');
      watchers.forEach((watcher) => watcher.close());
    }
  }

  let server: ServerContext | undefined;
  function setServerContext(_server: ServerContext) {
    server = _server;
  }

  return {
    scanPages,
    writeConfigFiles,

    setServerContext,
    stopWatcher,

    generateRoutes,
    generateResolver,

    definePageTransform(code: string, id: string) {
      return definePageTransform({
        code,
        id,
      });
    },
  };
}
