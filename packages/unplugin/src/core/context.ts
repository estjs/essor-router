import { promises as fs } from 'node:fs';
import { glob } from 'tinyglobby';
import { dirname, relative, resolve } from 'pathe';
import { type FSWatcher, watch as fsWatch } from 'chokidar';
import { isFunction } from '@estjs/shared';
import { EditableTreeNode } from './extendRoutes';
import { definePageTransform, extractDefinePageInfo } from './definePage';
import {
  type HandlerContext,
  RoutesFolderWatcher,
  resolveFolderOptions,
} from './RoutesFolderWatcher';
import { asRoutePath, logTree, throttle } from './utils';
import { PrefixTree, type TreeNode } from './tree';
import { loadConfigRoutes } from './configSource';
import { generateTypedRouterDts } from './dts';
import { generateResolverModule, generateRoutesModule } from './virtualModules';
import {
  createParamParserWatcher,
  deleteParamParserFile,
  scanParamParserFolder,
  setParamParserFile,
} from './paramParsers';
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
        return options.logs ? res : () => {};
      }
      return res;
    },
  });

  // populated by the initial scan pages
  const watchers: Array<FSWatcher | RoutesFolderWatcher> = [];
  let hasScanned = false;
  const paramParsersMap: ParamParsersMap = new Map();
  const definePageFileFlags = new Map<string, boolean>();

  async function scanPages(startWatchers = true) {
    if (options.extensions.length < 1) {
      throw new Error('"extensions" cannot be empty. Please specify at least one extension.');
    }

    // initial scan was already done
    if (hasScanned) {
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
      hasScanned = true;
      return;
    }

    // ── File-based routing (existing logic, unchanged) ────────────────────────
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
          watchers.push(setupParamParserWatcher(folder));
        }

        return scanParamParserFolder(paramParsersMap, folder, dtsDir).then(() => {
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
    hasScanned = true;
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
        // eslint-disable-next-line unicorn/prefer-dom-node-remove
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

  function setupParamParserWatcher(folder: string) {
    logger.log(`🤖 Scanning param parsers in ${folder}`);
    return createParamParserWatcher(
      folder,
      (file) => {
        setParamParserFile(paramParsersMap, folder, file, dtsDir);
        writeConfigFiles();
        server?.updateRoutes();
      },
      (file) => {
        deleteParamParserFile(paramParsersMap, file);
        writeConfigFiles();
        server?.updateRoutes();
      },
    );
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

  async function generateResolver() {
    return generateResolverModule(routeTree, options, paramParsersMap);
  }

  async function generateRoutes() {
    return generateRoutesModule(routeTree, options);
  }

  async function generateDTS() {
    return generateTypedRouterDts(routeTree, options, paramParsersMap);
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

  async function stopWatcher() {
    const activeWatchers = watchers.splice(0);
    if (activeWatchers.length) {
      logger.log('🛑 stopping watcher');
      await Promise.all(activeWatchers.map((watcher) => watcher.close()));
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
