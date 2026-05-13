import { generateHmrBlock } from './hmr';
import { ImportsMap } from './utils';
import type { ParamParsersMap } from '../codegen/generateParamParsers';
import type { ResolvedOptions } from '../options';
import type { PrefixTree } from './tree';

export async function generateResolverModule(
  routeTree: PrefixTree,
  options: ResolvedOptions,
  paramParsersMap: ParamParsersMap,
): Promise<string> {
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

  return `${imports}${routeDupsWarns}\n${aliasWarns}\n${missingParserErrors}${resolverCode}\n${generateHmrBlock(
    'resolver',
    'router._hmrReplaceResolver(mod.resolver)',
  )}`;
}

export async function generateRoutesModule(
  routeTree: PrefixTree,
  options: ResolvedOptions,
): Promise<string> {
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

  return `${imports}${routeDupsWarns}\n${routeList}${generateHmrBlock(
    'routes',
    `router.clearRoutes()
    for (const route of mod.routes) {
      router.addRoute(route)
    }`,
  )}\n`;
}
