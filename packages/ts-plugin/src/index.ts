import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { type TsPluginConfig, resolvePluginConfig } from './config';
import { generateProxyModule } from './proxyGenerator';
import { guessProjectRoot, loadRouteMapFromDts, mapFileToRoute } from './routeMap';

interface TypeScriptModule {
  server: {
    PluginCreateInfo: any;
  };
}

const warnedTypedRouterPaths = new Set<string>();
const normalizePath = (value: string) => value.split('\\').join('/');

function init(modules: { typescript: TypeScriptModule }) {
  void modules;

  return {
    create(info: any) {
      const config = resolvePluginConfig(info.config as TsPluginConfig);

      const getProxyFile = (containingFile: string) => {
        const hostCwd =
          info.project?.getCurrentDirectory?.() ??
          info.languageServiceHost.getCurrentDirectory?.() ??
          process.cwd();
        const projectRoot = guessProjectRoot(
          containingFile,
          config.routesFolder,
          config.typedRouterDts,
          hostCwd,
        );
        const typedRouterPath = resolve(projectRoot, config.typedRouterDts);
        if (!existsSync(typedRouterPath) && !warnedTypedRouterPaths.has(typedRouterPath)) {
          console.warn(
            `[essor-router-ts-plugin] typed router declaration not found at ${typedRouterPath}`,
          );
          warnedTypedRouterPaths.add(typedRouterPath);
        }

        const routeMap = loadRouteMapFromDts(projectRoot, config.typedRouterDts);

        const relPath = normalizePath(relative(projectRoot, containingFile));
        const infosForFile = routeMap.get(relPath);
        if (!infosForFile || infosForFile.length === 0) return null;

        const fileRouteName = mapFileToRoute(containingFile, projectRoot, config.routesFolder);
        const proxyPath = join(projectRoot, 'node_modules', '.essor-router', `${fileRouteName}.ts`);

        try {
          mkdirSync(dirname(proxyPath), { recursive: true });
          writeFileSync(proxyPath, generateProxyModule(config.moduleName, infosForFile), 'utf8');
        } catch {
          // Ignore write errors to cache dir
        }
        return proxyPath;
      };

      const originalResolve = info.languageServiceHost.resolveModuleNames?.bind(
        info.languageServiceHost,
      );

      if (originalResolve) {
        info.languageServiceHost.resolveModuleNames = (
          moduleNames: string[],
          containingFile: string,
          ...rest: unknown[]
        ) => {
          const proxyPath = getProxyFile(containingFile);

          return moduleNames.map((moduleName, index) => {
            if (moduleName !== config.moduleName || !proxyPath) {
              return originalResolve(moduleNames, containingFile, ...rest)?.[index];
            }

            return {
              resolvedFileName: proxyPath,
              extension: '.ts',
              isExternalLibraryImport: false,
            };
          });
        };
      }

      const originalResolveLiterals = info.languageServiceHost.resolveModuleNameLiterals?.bind(
        info.languageServiceHost,
      );

      if (originalResolveLiterals) {
        info.languageServiceHost.resolveModuleNameLiterals = (
          moduleLiterals: any[],
          containingFile: string,
          ...rest: unknown[]
        ) => {
          const proxyPath = getProxyFile(containingFile);

          return moduleLiterals.map((moduleLiteral, index) => {
            if (moduleLiteral.text !== config.moduleName || !proxyPath) {
              return originalResolveLiterals(moduleLiterals, containingFile, ...rest)?.[index];
            }

            return {
              resolvedModule: {
                resolvedFileName: proxyPath,
                extension: '.ts',
                isExternalLibraryImport: false,
              },
            };
          });
        };
      }

      return info.languageService;
    },
  };
}

export = init;
