import type { FileRouteInfo } from './routeMap';

export function generateProxyModule(
  moduleName: string,
  info: FileRouteInfo | FileRouteInfo[],
): string {
  const infos = Array.isArray(info) ? info : [info];
  const names = unionValues(infos.map(route => `'${route.routeName}'`));
  const paths = unionValues(infos.map(route => `'${route.pathPattern}'`));
  const params = unionValues(infos.map(route => renderParams(route.params)));

  return [
    `import type { RouteLocationNormalizedLoaded } from '${moduleName}'`,
    `export * from '${moduleName}'`,
    `export { default } from '${moduleName}'`,
    '',
    `export function useRoute(): Omit<RouteLocationNormalizedLoaded, 'name' | 'path' | 'params'> & {`,
    `  name: ${names}`,
    `  path: ${paths}`,
    `  params: ${params}`,
    `} {`,
    '  return null as any',
    '}',
    '',
  ].join('\n');
}

function renderParams(params: FileRouteInfo['params']): string {
  const keys = Object.keys(params);
  if (keys.length === 0) {
    return 'Record<never, never>';
  }
  return `{ ${keys.map(key => `${key}: ${params[key] === 'string[]' ? 'string[]' : 'string'}`).join('; ')} }`;
}

function unionValues(values: string[]): string {
  const unique = Array.from(new Set(values));
  if (unique.length === 0) return 'never';
  if (unique.length === 1) return unique[0];
  return unique.join(' | ');
}
