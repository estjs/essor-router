import { isString, isObject as sharedIsObject } from '@estjs/shared';
import { toStringLiteral } from '../utils';
import type { ResolvedOptions, RoutesFolderOptionResolved } from './options';
import type { TreeNode } from './tree';
import type { RouteRecordOverride } from './treeNodeValue';

export function warn(msg: string, type: 'warn' | 'error' = 'warn'): void {
  const message = `⚠️  [essor-router]: ${msg}`;
  if (type === 'error') {
    console.error(message);
  } else {
    console.warn(message);
  }
}

export function logTree(tree: TreeNode, log: (str: string) => any) {
  log(printTree(tree));
}

const MAX_LEVEL = 1000;
function printTree(
  tree: TreeNode | TreeNode['children'],
  level = 0,
  parentPre = '',
  treeStr = '',
): string {
  // end of recursion
  if (typeof tree !== 'object' || level >= MAX_LEVEL) return '';

  if (tree instanceof Map) {
    const total = tree.size;
    let index = 0;
    for (const [_key, child] of tree) {
      const hasNext = index++ < total - 1;
      const { children } = child;

      treeStr += `${`${parentPre}${hasNext ? '├' : '└'}${`─${children.size > 0 ? '┬' : ''}`} `}${child}\n`;

      if (children) {
        treeStr += printTree(children, level + 1, `${parentPre}${hasNext ? '│' : ' '} `);
      }
    }
  } else {
    const children = tree.children;
    treeStr = `${tree}\n`;
    if (children) {
      treeStr += printTree(children, level + 1);
    }
  }

  return treeStr;
}

export const isArray = Array.isArray;

export function trimExtension(path: string, extensions: ResolvedOptions['extensions']) {
  for (const extension of extensions) {
    if (path.endsWith(extension)) {
      return path.slice(0, -extension.length);
    }
  }
  // no extension found, return the original path
  return path;
}

export interface ThrottledFn {
  (): void;
  /** Cancels any pending invocation and clears outstanding timers. */
  cancel: () => void;
}

export function throttle(fn: () => void, wait: number, initialWait: number): ThrottledFn {
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  let pending = false;
  let firstTimeout: ReturnType<typeof setTimeout> | null = null;

  const throttled = () => {
    if (pendingTimeout == null) {
      pendingTimeout = setTimeout(() => {
        pendingTimeout = null;
        if (pending) {
          pending = false;
          fn();
        }
      }, wait);
      firstTimeout = setTimeout(() => {
        firstTimeout = null;
        fn();
      }, initialWait);
    } else if (firstTimeout == null) {
      pending = true;
    }
  };

  throttled.cancel = () => {
    if (pendingTimeout != null) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }
    if (firstTimeout != null) {
      clearTimeout(firstTimeout);
      firstTimeout = null;
    }
    pending = false;
  };

  return throttled;
}

export const LEADING_SLASH_RE = /^\//;
export const TRAILING_SLASH_RE = /\/$/;
export const ESCAPED_TRAILING_SLASH_RE = /\\\/$/;
export function joinPath(...paths: string[]): string {
  let result = '';
  for (const path of paths) {
    result =
      result.replace(TRAILING_SLASH_RE, '') +
      // check path to avoid adding a trailing slash when joining an empty string
      (path && `/${path.replace(LEADING_SLASH_RE, '')}`);
  }
  return result || '/';
}

export function mergeRouteRecordOverride(
  a: RouteRecordOverride,
  b: RouteRecordOverride,
): RouteRecordOverride {
  const merged: RouteRecordOverride = {};
  const keys = [
    ...new Set<keyof RouteRecordOverride>([
      ...(Object.keys(a) as (keyof RouteRecordOverride)[]),
      ...(Object.keys(b) as (keyof RouteRecordOverride)[]),
    ]),
  ];

  for (const key of keys) {
    if (key === 'alias') {
      const newAlias: string[] = [];
      merged[key] = newAlias.concat(a.alias || [], b.alias || []);
    } else if (key === 'meta') {
      merged[key] = mergeDeep(a[key] || {}, b[key] || {});
    } else if (key === 'params') {
      merged[key] = {
        path: {
          ...a[key]?.path,
          ...b[key]?.path,
        },
        query: {
          ...a[key]?.query,
          ...b[key]?.query,
        },
      };
    } else if (key === 'start') {
      merged[key] = {
        ...(a[key] || {}),
        ...(b[key] || {}),
      };
    } else {
      merged[key] = b[key] ?? a[key];
    }
  }

  return merged;
}

export const isObject = sharedIsObject;

function mergeDeep(...objects: Array<Record<string, unknown>>): Record<string, unknown> {
  return objects.reduce(
    (prev, obj) => {
      for (const key of Object.keys(obj)) {
        const pVal = prev[key];
        const oVal = obj[key];
        if (Array.isArray(pVal) && Array.isArray(oVal)) {
          prev[key] = [...pVal, ...oVal];
        } else if (isObject(pVal) && isObject(oVal)) {
          prev[key] = mergeDeep(pVal, oVal);
        } else if (oVal !== undefined) {
          prev[key] = oVal;
        }
      }
      return prev;
    },
    {} as Record<string, unknown>,
  );
}

/**
 * Returns a route path to be used by the router with any defined prefix from an absolute path to a file. Since it
 * returns a route path, it will remove the extension from the file.
 *
 * @param options - RoutesFolderOption to apply
 * @param options.src - absolute path to the pages folder
 * @param options.path - route path prefix or a function to build it
 * @param options.extensions - file extensions to strip
 * @param filePath - absolute path to file
 * @returns a route path to be used by the router with any defined prefix
 */
export function asRoutePath(
  { src, path = '', extensions }: Pick<RoutesFolderOptionResolved, 'src' | 'path' | 'extensions'>,
  filePath: string,
) {
  return trimExtension(
    isString(path)
      ? // add the path prefix if any
        path +
          // remove the absolute path to the pages folder
          filePath.slice(src.length + 1)
      : path(filePath),
    extensions,
  );
}

/**
 * Builds a pattern from a file pattern and a list of extensions.
 *
 * @param filePatterns - the file pattern to append the extensions to e.g. **‍/*
 * @param extensions - array of extensions to append to the pattern e.g. ['.essor', '.js']
 * @returns the pattern with the extensions appended
 */
export function appendExtensionListToPattern(filePatterns: string, extensions: string[]): string;
export function appendExtensionListToPattern(
  filePatterns: string[],
  extensions: string[],
): string[];
export function appendExtensionListToPattern(
  filePatterns: string | string[],
  extensions: string[],
): string[] | string {
  const extensionPattern =
    extensions.length === 1
      ? extensions[0]
      : `.{${extensions.map((extension) => extension.replace('.', '')).join(',')}}`;

  return Array.isArray(filePatterns)
    ? filePatterns.map((filePattern) => `${filePattern}${extensionPattern}`)
    : `${filePatterns}${extensionPattern}`;
}

export interface ImportEntry {
  // name of the variable to import
  name: string;
  // optional name to use when importing
  as?: string;
}

export class ImportsMap {
  // path -> import as -> import name
  // e.g map['essor-router']['myUseRouter'] = 'useRouter' -> import { useRouter as myUseRouter } from 'essor-router'
  private map = new Map<string, Map<string, string>>();

  add(path: string, importEntry: ImportEntry): this;
  add(path: string, importEntry: string): this;
  add(path: string, importEntry: string | ImportEntry): this {
    if (!this.map.has(path)) {
      this.map.set(path, new Map());
    }
    const imports = this.map.get(path)!;
    if (isString(importEntry)) {
      imports.set(importEntry, importEntry);
    } else {
      imports.set(importEntry.as || importEntry.name, importEntry.name);
    }

    return this;
  }

  /**
   * Check if the given path has the given import name.
   *
   * @param path - the path to check
   * @param name - the import name to check
   */
  has(path: string, name: string): boolean {
    return this.map.has(path) && this.map.get(path)!.has(name);
  }

  /**
   * Add a default import. Alias for `add(path, { name: 'default', as })`.
   *
   * @param path - the path to import from
   * @param as - the name to import as
   */
  addDefault(path: string, as: string): this {
    return this.add(path, { name: 'default', as });
  }

  /**
   * Get the list of imports for the given path.
   *
   * @param path - the path to get the import list for
   * @returns the list of imports for the given path
   */
  getImportList(path: string): Required<ImportEntry>[] {
    if (!this.map.has(path)) return [];
    return Array.from(this.map.get(path)!).map(([as, name]) => ({
      as: as || name,
      name,
    }));
  }

  toString(): string {
    let importStatements = '';
    for (const [path, imports] of this.map) {
      if (!imports.size) continue;

      const fromImportPath = toStringLiteral(path);

      // only one import and it's the default one
      if (imports.size === 1) {
        // we extract the first and only entry
        const [[importName, maybeDefault]] = [...imports.entries()] as [[string, string]];
        // we only care if this is the default import
        if (maybeDefault === 'default') {
          importStatements += `import ${importName} from ${fromImportPath}\n`;
          continue;
        }
      }
      importStatements += `import { ${Array.from(imports)
        .map(([as, name]) => (as === name ? name : `${name} as ${as}`))
        .join(', ')} } from ${fromImportPath}\n`;
    }

    return importStatements;
  }

  get size(): number {
    return this.map.size;
  }
}
