import process from 'node:process';
import { isPackageExists as isPackageInstalled } from 'local-pkg';
import { resolve } from 'pathe';
import { isFunction, isString } from '@estjs/shared';
import { getFileBasedRouteName, isArray, warn } from './core/utils';
import type { EditableTreeNode } from './core/extendRoutes';
import type { TreeNode } from './core/tree';
import type { ParseSegmentOptions } from './core/treeNodeValue';
import type { _Awaitable } from './utils';

/**
 * Options for a routes folder.
 */
export interface RoutesFolderOption {
  /**
   * Folder to scan files that should be used for routes. **Cannot be a glob**, use the `path`, `filePatterns`, and
   * `exclude` options to filter out files. This section will **be removed** from the resulting path.
   */
  src: string;

  /**
   * Prefix to add to the route path **as is**. Defaults to `''`. Can also be a function
   * to reuse parts of the filepath, in that case you should return a **modified version of the filepath**.
   *
   * @example
   * ```js
   * {
   *   src: 'src/pages',
   *   // this is equivalent to the default behavior
   *   path: (file) => file.slice(file.lastIndexOf('src/pages') + 'src/pages'.length
   * },
   * {
   *   src: 'src/features',
   *   // match all files (note the \ is not needed in real code)
   *   filePatterns: '*‍/pages/**\/',
   *   path: (file) => {
   *     const prefix = 'src/features'
   *     // remove the everything before src/features and removes /pages
   *     // /src/features/feature1/pages/index.tsx -> feature1/index.tsx
   *     return file.slice(file.lastIndexOf(prefix) + prefix.length + 1).replace('/pages', '')
   *   },
   * },
   * {
   *   src: 'src/docs',
   *   // adds a prefix with a param
   *   path: 'docs/[lang]/',
   * },
   * ```
   */
  path?: string | ((filepath: string) => string);

  /**
   * Allows to override the global `filePattern` option for this folder. It can also extend the global values by passing
   * a function that returns an array.
   */
  filePatterns?: _OverridableOption<string[], string | string[]>;

  /**
   * Allows to override the global `exclude` option for this folder. It can
   * also extend the global values by passing a function that returns an array.
   */
  exclude?: _OverridableOption<string[], string | string[]>;

  /**
   * Allows to override the global `extensions` option for this folder. It can
   * also extend the global values by passing a function that returns an array.
   * The provided extensions are removed from the final route. For example,
   * `.page.tsx` allows to suffix all pages with `.page.tsx` and remove it from
   * the route name.
   */
  extensions?: _OverridableOption<string[]>;
}

/**
 * Normalized options for a routes folder.
 */
export interface RoutesFolderOptionResolved extends RoutesFolderOption {
  path: string | ((filepath: string) => string);
  /**
   * Final glob pattern to match files in the folder.
   */
  pattern: string[];
  filePatterns: string[];
  exclude: string[];
  extensions: string[];
}

/**
 * An option that can be overridden by providing a function that receives the
 * existing value and returns a new one.
 *
 * @internal
 */
export type _OverridableOption<T, AllowedTypes = T> = AllowedTypes | ((existing: T) => T);

/**
 * Resolves an overridable option by calling the function with the existing
 * value if it's a function, otherwise returning the passed `value`. If `value`
 * is undefined, it returns the `defaultValue` instead.
 *
 * @param defaultValue default value for the option
 * @param value and overridable option
 *
 * @internal
 */
export function resolveOverridableOption<T>(defaultValue: T, value?: _OverridableOption<T, T>): T {
  return isFunction(value) ? (value as (existing: T) => T)(defaultValue) : (value ?? defaultValue);
}

/**
 * @internal
 */
export type _RoutesFolder = string | RoutesFolderOption;

/**
 * Type for the {@link Options.routesFolder} option.
 */
export type RoutesFolder = _RoutesFolder[] | _RoutesFolder;

/**
 * essor-router plugin options.
 */
export interface Options {
  /**
   * Extensions of files to be considered as route files. Cannot be empty.
   * @default `['.tsx', '.ts', '.jsx', '.js']`
   */
  extensions?: string[];

  /**
   * Folder(s) to scan for files and generate routes. Can also be an array if you want to add multiple
   * folders, or an object if you want to define a route prefix. Supports glob patterns but must be a folder, use
   * `extensions` and `exclude` to filter files.
   *
   * @default `"src/pages"`
   */
  routesFolder?: RoutesFolder;

  /**
   * Array of `picomatch` globs to ignore. Note the globs are relative to the cwd, so avoid writing
   * something like `['ignored']` to match folders named that way, instead provide a path similar to the `routesFolder`:
   * `['src/pages/ignored/**']` or use `['**\/ignored']` to match every folder named `ignored`.
   * @default `[]`
   */
  exclude?: string[] | string;

  /**
   * Pattern to match files in the `routesFolder`. Defaults to `*\/*` plus a
   * combination of all the possible extensions, e.g. `*\/*.{tsx,md}` if
   * `extensions` is set to `['.essor', '.md']`. This is relative to the {@link
   * RoutesFolderOption['src']} and
   *
   * @default `['*\/*']`
   */
  filePatterns?: string[] | string;

  /**
   * Method to generate the name of a route. It's recommended to keep the default value to guarantee a consistent,
   * unique, and predictable naming.
   */
  getRouteName?: (node: TreeNode) => string;

  /**
   * Allows extending a route by modifying its node, adding children, or even deleting it. This will be invoked once for
   * each route.
   *
   * @param route - {@link EditableTreeNode} of the route to extend
   */
  extendRoute?: (route: EditableTreeNode) => _Awaitable<void>;

  /**
   * Allows to do some changes before writing the files. This will be invoked **every time** the files need to be written.
   *
   * @param rootRoute - {@link EditableTreeNode} of the root route
   */
  beforeWriteFiles?: (rootRoute: EditableTreeNode) => _Awaitable<void>;

  /**
   * Defines how page components should be imported. Defaults to dynamic imports to enable lazy loading of pages.
   * @default `'async'`
   */
  importMode?: 'sync' | 'async' | ((filepath: string) => 'sync' | 'async');

  /**
   * Root of the project. All paths are resolved relatively to this one.
   * @default `process.cwd()`
   */
  root?: string;

  /**
   * Should we generate d.ts files or ont. Defaults to `true` if `typescript` is installed. Can be set to a string of
   * the filepath to write the d.ts files to. By default it will generate a file named `typed-router.d.ts`.
   * @default `true`
   */
  dts?: boolean | string;

  /**
   * Allows inspection by vite-plugin-inspect by not adding the leading `\0` to the id of virtual modules.
   * @internal
   */
  _inspect?: boolean;

  /**
   * Activates debug logs.
   */
  logs?: boolean;

  /**
   * @inheritDoc
   */
  pathParser?: ParseSegmentOptions;

  /**
   * Whether to watch the files for changes.
   *
   * Defaults to `true` unless the `CI` environment variable is set.
   *
   * @default `!process.env.CI`
   */
  watch?: boolean;

  /**
   * Route input mode.
   * - `'file'` (default): scan `routesFolder` to generate routes from the filesystem.
   * - `'config'`: parse an explicit route config file (`configRoutes`) to generate routes.
   *
   * The two modes are mutually exclusive.
   *
   * @default `'file'`
   */
  mode?: 'file' | 'config';

  /**
   * Path to a file that calls `defineConfigRoutes()`. Required when `mode` is `'config'`.
   * The path is resolved relative to `root`.
   *
   * @example `'src/routes.config.ts'`
   */
  configRoutes?: string;

  /**
   * Experimental options. **Warning**: these can change or be removed at any time, even it patch releases. Keep an eye
   * on the Changelog.
   */
  experimental?: {
    /**
     * (Vite only). File paths or globs where loaders are exported. This will be used to filter out imported loaders and
     * automatically re export them in page components. You can for example set this to `'src/loaders/**\/*'` (without
     * the backslash) to automatically re export any imported variable from files in the `src/loaders` folder within a
     * page component.
     */
    autoExportsDataLoaders?: string | string[];

    /**
     * Enable experimental support for the new custom resolvers and allows
     * defining custom param matchers.
     */
    paramParsers?: boolean | ParamParsersOptions;
  };
}

/**
 * Options for experimental param parsers.
 */
export interface ParamParsersOptions {
  /**
   * Folder(s) to scan for param matchers. Set to an empty array to disable the feature.
   *
   * @default `['src/params']`
   */
  dir?: string | string[];
}

/**
 * Default options for experimental param parsers.
 */
export const DEFAULT_PARAM_PARSERS_OPTIONS = {
  dir: ['src/params'],
} satisfies Required<ParamParsersOptions>;

/**
 * Default plugin options.
 */
export const DEFAULT_OPTIONS = {
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
  exclude: [],
  routesFolder: 'src/pages',
  filePatterns: ['**/*'],
  getRouteName: getFileBasedRouteName,
  importMode: 'async',
  root: process.cwd(),
  dts: isPackageInstalled('typescript'),
  logs: false,
  _inspect: false,
  pathParser: {
    dotNesting: true,
  },
  watch: !process.env.CI,
  mode: 'file' as 'file' | 'config',
  experimental: {},
} satisfies Options;

/**
 * Expected server context provided to hooks.
 *
 * @internal
 */
export interface ServerContext {
  /**
   * Invalidates a module by its id.
   * @param module - module id to invalidate
   *
   * @returns A promise that resolves when the module is invalidated, or `false` if the module was not found.
   */
  invalidate: (module: string) => Promise<void> | false;

  /**
   * Invalidates all modules associated with a page file.
   * @param filepath - file path of the page to invalidate
   *
   * @returns A promise that resolves when the page is invalidated, or `false` if no modules were found for the page.
   */
  invalidatePage: (filepath: string) => Promise<void> | false;

  /**
   * Triggers HMR for the routes module.
   */
  updateRoutes: () => Promise<void>;

  /**
   * Triggers a full page reload.
   */
  reload: () => void;
}

function normalizeRoutesFolderOption(routesFolder: RoutesFolder) {
  return (isArray(routesFolder) ? routesFolder : [routesFolder]).map((routeOption) =>
    normalizeRouteOption(isString(routeOption) ? { src: routeOption } : routeOption),
  );
}

function normalizeOverridableArray(
  value: undefined | string | string[] | ((existing: string[]) => string[]),
): undefined | string[] | ((existing: string[]) => string[]) {
  if (!value) return undefined;
  if (isFunction(value)) return value;
  return isArray(value) ? value : [value];
}

function normalizeRouteOption(routeOption: RoutesFolderOption) {
  return {
    ...routeOption,
    filePatterns: normalizeOverridableArray(routeOption.filePatterns),
    exclude: normalizeOverridableArray(routeOption.exclude),
  };
}

/**
 * Normalize user options with defaults and resolved paths.
 *
 * @param options - user provided options
 * @returns normalized options
 */
export function resolveOptions(options: Options) {
  const root = options.root || DEFAULT_OPTIONS.root;

  const routesFolder = normalizeRoutesFolderOption(
    options.routesFolder || DEFAULT_OPTIONS.routesFolder,
  ).map((routeOption) => ({
    ...routeOption,
    src: resolve(root, routeOption.src),
  }));

  const paramParsers = options.experimental?.paramParsers
    ? options.experimental.paramParsers === true
      ? DEFAULT_PARAM_PARSERS_OPTIONS
      : { ...DEFAULT_PARAM_PARSERS_OPTIONS, ...options.experimental.paramParsers }
    : undefined;

  const paramParsersDir = (
    paramParsers?.dir ? (isArray(paramParsers.dir) ? paramParsers.dir : [paramParsers.dir]) : []
  ).map((dir) => resolve(root, dir));

  const autoExportsDataLoaders = options.experimental?.autoExportsDataLoaders
    ? (isArray(options.experimental.autoExportsDataLoaders)
        ? options.experimental.autoExportsDataLoaders
        : [options.experimental.autoExportsDataLoaders]
      ).map((path) => resolve(root, path))
    : undefined;

  const experimental = {
    ...options.experimental,
    autoExportsDataLoaders,
    paramParsers: paramParsers && { ...paramParsers, dir: paramParsersDir },
  };

  if (options.extensions) {
    options.extensions = options.extensions
      .map((ext) => {
        if (!ext.startsWith('.')) {
          warn(`Invalid extension "${ext}". Extensions must start with a dot.`);
          return `.${ext}`;
        }
        return ext;
      })
      .sort((a, b) => b.length - a.length);
  }

  const filePatterns = isArray(options.filePatterns)
    ? options.filePatterns
    : options.filePatterns
      ? [options.filePatterns]
      : DEFAULT_OPTIONS.filePatterns;
  const exclude = isArray(options.exclude)
    ? options.exclude
    : options.exclude
      ? [options.exclude]
      : DEFAULT_OPTIONS.exclude;

  const mode = options.mode ?? DEFAULT_OPTIONS.mode;
  const configRoutes =
    options.configRoutes != null ? resolve(root, options.configRoutes) : undefined;

  if (mode === 'config' && !configRoutes) {
    throw new Error('[essor-router] `configRoutes` is required when `mode` is set to "config".');
  }

  return {
    ...DEFAULT_OPTIONS,
    ...options,
    experimental,
    routesFolder,
    filePatterns,
    exclude,
    mode,
    configRoutes,
  };
}

/**
 * @internal
 */
export type ResolvedOptions = ReturnType<typeof resolveOptions>;

/**
 * Merge all the possible extensions as an array of unique values
 * @param options - user provided options
 * @internal
 */
export function mergeAllExtensions(options: ResolvedOptions): string[] {
  const allExtensions = new Set(options.extensions);
  for (const routeOption of options.routesFolder) {
    if (routeOption.extensions) {
      for (const ext of resolveOverridableOption(options.extensions, routeOption.extensions)) {
        allExtensions.add(ext);
      }
    }
  }
  return [...allExtensions];
}
