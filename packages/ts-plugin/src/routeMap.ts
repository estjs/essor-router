import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

export interface FileRouteInfo {
  routeName: string;
  pathPattern: string;
  params: Record<string, 'string' | 'string[]'>;
}

export function loadRouteMapFromDts(
  projectRoot: string,
  dtsFile: string,
): Map<string, FileRouteInfo[]> {
  const map = new Map<string, FileRouteInfo[]>();
  const abs = resolve(projectRoot, dtsFile);

  let source = '';
  try {
    source = readFileSync(abs, 'utf8');
  } catch {
    return map;
  }

  // 1. Gather all route metadata from RouteRecordInfo
  const routeRecordMap = new Map<string, FileRouteInfo>();
  const entryRegex = /'([^']+)'\s*:\s*RouteRecordInfo<\s*'[^']+',\s*'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(source))) {
    const routeName = match[1];
    const pathPattern = match[2];
    routeRecordMap.set(routeName, {
      routeName,
      pathPattern,
      params: inferParams(pathPattern),
    });
  }

  // 2. Map files to routes using _RouteFileInfoMap
  const fileRegex = /'([^']+)'\s*:\s*\{\s*routes:\s*([\s\S]*?)\s*views:/g;
  let fileMatch: RegExpExecArray | null;
  while ((fileMatch = fileRegex.exec(source))) {
    const filePath = fileMatch[1]; // e.g., src/pages/post/[[id]].tsx
    const routesBlock = fileMatch[2]; // e.g., | '/post/[[id]]'

    // Extract route names from the union block e.g | '/about' | '/another'
    const routeNamesRegex = /\|\s*'([^']+)'/g;
    const matchedRouteNames: string[] = [];
    let nameMatch;
    while ((nameMatch = routeNamesRegex.exec(routesBlock))) {
      matchedRouteNames.push(nameMatch[1]);
    }

    // Map filePath -> FileRouteInfo[]
    const routesInfo = matchedRouteNames
      .map(name => routeRecordMap.get(name))
      .filter(Boolean) as FileRouteInfo[];

    if (routesInfo.length > 0) {
      map.set(filePath, routesInfo);
    }
  }

  return map;
}

export function mapFileToRoute(
  containingFile: string,
  projectRoot: string,
  routesFolder = 'src/pages',
): string {
  const rel = normalizePath(relative(projectRoot, containingFile));
  const withoutExt = rel.replace(/\.[^.]+$/, '');
  const parts = withoutExt.split('/').filter(Boolean);
  const routeFolderParts = normalizeRoutesFolder(routesFolder).split('/').filter(Boolean);
  const routeFolderIndex = findSubPathIndex(parts, routeFolderParts);
  const normalized =
    routeFolderIndex >= 0 ? parts.slice(routeFolderIndex + routeFolderParts.length) : parts;

  const names = normalized
    .filter((segment, index) => !(segment === 'index' && index === normalized.length - 1))
    .map(segment => segment.replace(/^\[\.\.\.(.+)\]$/, '$1-all').replace(/^\[(.+)\]$/, '$1'));

  return (names.join('-') || 'index').replace(/[^\w-]/g, '-');
}

function inferParams(pathPattern: string): Record<string, 'string' | 'string[]'> {
  const params: Record<string, 'string' | 'string[]'> = {};
  for (const match of pathPattern.matchAll(/:(\w+)(\(\.\*\)\*)?/g)) {
    params[match[1]] = match[2] ? 'string[]' : 'string';
  }
  return params;
}

export function guessProjectRoot(
  fileName: string,
  routesFolder = join('src', 'pages'),
  typedRouterDts = 'typed-router.d.ts',
  hostCwd = process.cwd(),
): string {
  const normalizedRoutesFolder = normalizeRoutesFolder(routesFolder);
  const normalizedFile = normalizePath(fileName);
  let root: string | null = null;

  if (normalizedRoutesFolder) {
    const marker = `/${normalizedRoutesFolder}/`;
    const index = normalizedFile.lastIndexOf(marker);
    if (index !== -1) {
      root = normalizedFile.slice(0, index);
    }
  }

  if (!root) {
    root = hostCwd;
  }

  const typedRouterPath = resolve(root, typedRouterDts);
  if (typedRouterDts && !existsSync(typedRouterPath)) {
    const fallback = findRootByTypedRouter(fileName, typedRouterDts);
    if (fallback) {
      root = fallback;
    }
  }

  return root || hostCwd;
}

function normalizePath(value: string): string {
  return value.split('\\').join('/');
}

function normalizeRoutesFolder(routesFolder: string): string {
  return normalizePath(routesFolder)
    .replace(/^\.?\//, '')
    .replace(/\/+$/, '');
}

function findSubPathIndex(parts: string[], subPathParts: string[]): number {
  if (subPathParts.length === 0 || subPathParts.length > parts.length) {
    return -1;
  }

  for (let i = 0; i <= parts.length - subPathParts.length; i++) {
    let isMatch = true;
    for (const [j, subPathPart] of subPathParts.entries()) {
      if (parts[i + j] !== subPathPart) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      return i;
    }
  }

  return -1;
}

function findRootByTypedRouter(fileName: string, typedRouterDts: string): string | null {
  if (!typedRouterDts) {
    return null;
  }

  let dir = dirname(fileName);
  while (true) {
    const candidate = resolve(dir, typedRouterDts);
    if (existsSync(candidate)) {
      return dir;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return null;
}
