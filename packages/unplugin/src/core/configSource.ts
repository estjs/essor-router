import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'pathe';
import { parse as babelParse } from '@babel/parser';
import type { PrefixTree, TreeNode } from './tree';
import type {
  ArrayExpression,
  CallExpression,
  Expression,
  ObjectExpression,
  ObjectProperty,
  StringLiteral,
} from '@babel/types';
import type { ResolvedOptions } from '../options';

/**
 * A statically parsed route from the config file.
 * Only literal/serialisable fields are extracted; dynamic values (e.g. functions) are ignored.
 */
export interface ParsedConfigRoute {
  name?: string;
  path: string;
  /** Resolved absolute path extracted from `() => import('...')` */
  componentPath?: string;
  children?: ParsedConfigRoute[];
}

/**
 * Zero-cost identity function. Used by the plugin to locate the config entry point
 * and to provide `RouteRecordRaw[]` type-checking for the user.
 *
 * @example
 * ```ts
 * // src/routes.config.ts
 * import { defineConfigRoutes } from 'unplugin-essor-router'
 * export default defineConfigRoutes([
 *   { name: 'home', path: '/', component: () => import('./pages/Home') },
 * ])
 * ```
 */
export function defineConfigRoutes<T extends readonly object[]>(routes: T): T {
  return routes;
}

// ─── Babel AST helpers ───────────────────────────────────────────────────────

function getStringValue(node: Expression | null | undefined): string | undefined {
  if (node?.type === 'StringLiteral') return (node as StringLiteral).value;
  return undefined;
}

function getObjectProp(obj: ObjectExpression, key: string): Expression | undefined {
  for (const prop of obj.properties) {
    if (
      prop.type === 'ObjectProperty' &&
      !prop.computed &&
      ((prop.key.type === 'Identifier' && prop.key.name === key) ||
        (prop.key.type === 'StringLiteral' && prop.key.value === key))
    ) {
      const p = prop as ObjectProperty;
      return p.value as Expression;
    }
  }
  return undefined;
}

/**
 * Extracts the import path from `() => import('./pages/Foo')`.
 * Returns `undefined` for any non-trivial shapes.
 */
function extractImportPath(expr: Expression | undefined): string | undefined {
  if (!expr) return undefined;

  // `() => import('...')` or `async () => import('...')`
  if (expr.type === 'ArrowFunctionExpression') {
    const body = expr.body;
    if (body.type === 'CallExpression') {
      return extractImportPath(body as unknown as Expression);
    } else if (body.type === 'BlockStatement') {
      // 检查里面是否有 return import(...)
      // 简单起见，这里假设就长那样。
      return undefined;
    }
  }

  // `import('...')`
  if (expr.type === 'CallExpression') {
    const call = expr as CallExpression;
    if (call.callee.type === 'Import' && call.arguments[0]?.type === 'StringLiteral') {
      return (call.arguments[0] as StringLiteral).value;
    }
  }

  return undefined;
}

function parseRouteObject(
  obj: ObjectExpression,
  configDir: string,
  options: ResolvedOptions,
): ParsedConfigRoute | null {
  const pathNode = getObjectProp(obj, 'path');
  const path = getStringValue(pathNode);
  if (!path) return null; // `path` is required and must be a string literal

  const name = getStringValue(getObjectProp(obj, 'name'));

  // resolve component path relative to the config file's directory
  const importPath = extractImportPath(getObjectProp(obj, 'component'));
  let componentPath: string | undefined;
  if (importPath) {
    componentPath = relative(options.root, resolve(configDir, importPath));
  }

  const childrenNode = getObjectProp(obj, 'children');
  let children: ParsedConfigRoute[] | undefined;
  if (childrenNode?.type === 'ArrayExpression') {
    children = parseRouteArray(childrenNode as ArrayExpression, configDir, options);
  }

  return { name, path, componentPath, children: children?.length ? children : undefined };
}

function parseRouteArray(
  arr: ArrayExpression,
  configDir: string,
  options: ResolvedOptions,
): ParsedConfigRoute[] {
  const routes: ParsedConfigRoute[] = [];
  for (const elem of arr.elements) {
    if (elem?.type === 'ObjectExpression') {
      const route = parseRouteObject(elem as ObjectExpression, configDir, options);
      if (route) routes.push(route);
    }
  }
  return routes;
}

/**
 * Statically parses a `defineConfigRoutes([...])` call from `configPath`
 * and returns the extracted route definitions.
 */
function extractRoutesFromFile(configPath: string, options: ResolvedOptions): ParsedConfigRoute[] {
  if (!existsSync(configPath)) {
    throw new Error(`[essor-router] Failed to parse configRoutes file: ${configPath}`);
  }

  const src = readFileSync(configPath, 'utf8');
  const configDir = configPath.slice(0, configPath.lastIndexOf('/'));

  let ast: ReturnType<typeof babelParse>;
  try {
    ast = babelParse(src, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch {
    throw new Error(`[essor-router] Failed to parse configRoutes file: ${configPath}`);
  }

  // Walk top-level statements looking for `export default defineConfigRoutes([...])`
  for (const node of ast.program.body) {
    let callExpr: CallExpression | undefined;

    if (node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'CallExpression') {
      callExpr = node.declaration as CallExpression;
    }

    if (!callExpr) continue;

    // Verify the callee is `defineConfigRoutes`
    const callee = callExpr.callee;
    const calleeName =
      callee.type === 'Identifier'
        ? callee.name
        : callee.type === 'MemberExpression' && callee.property.type === 'Identifier'
          ? callee.property.name
          : undefined;

    if (calleeName !== 'defineConfigRoutes') continue;

    const firstArg = callExpr.arguments[0];
    if (firstArg?.type === 'ArrayExpression') {
      return parseRouteArray(firstArg as ArrayExpression, configDir, options);
    }
  }

  return [];
}

// ─── Tree population ──────────────────────────────────────────────────────────

/**
 * Inserts a list of parsed config routes into an existing {@link PrefixTree}.
 * The tree population algorithm mirrors the file-based route insertion so that
 * all downstream code-generation (generateRouteRecords, generateDTS…) works
 * without modification.
 */
function insertRoutesIntoTree(
  routes: ParsedConfigRoute[],
  tree: PrefixTree,
  options: ResolvedOptions,
  parentNode?: TreeNode,
): void {
  for (const route of routes) {
    // Remove the leading `/` so the path is relative, matching file-based route style
    const normalizedPath = route.path.replace(/^\//, '');

    // resolve the absolute path to register it correctly into the tree map
    const componentAbsolutePath = route.componentPath
      ? resolve(options.root, route.componentPath)
      : '';

    const node: TreeNode = parentNode
      ? parentNode.insertParsedPath(normalizedPath, componentAbsolutePath)
      : tree.insertParsedPath(normalizedPath, componentAbsolutePath);

    // Override the route name with the explicitly provided name
    if (route.name && componentAbsolutePath) {
      node.value.setOverride(componentAbsolutePath, { name: route.name });
    }

    // Store the component path so _RouteFileInfoMap can be populated
    if (componentAbsolutePath) {
      node.value.components.set('default', componentAbsolutePath);
    }

    if (route.children?.length) {
      insertRoutesIntoTree(route.children, tree, options, node);
    }
  }
}

/**
 * Entry point for config-based route loading.
 * Reads `options.configRoutes`, parses it via Babel, and populates `tree`.
 */
export function loadConfigRoutes(tree: PrefixTree, options: ResolvedOptions): void {
  const configPath = options.configRoutes!;
  const routes = extractRoutesFromFile(configPath, options);
  insertRoutesIntoTree(routes, tree, options);
}
