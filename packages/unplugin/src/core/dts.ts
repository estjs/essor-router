import type { ParamParsersMap } from '../codegen/generateParamParsers';
import type { ResolvedOptions } from '../options';
import type { PrefixTree } from './tree';

export async function generateTypedRouterDts(
  routeTree: PrefixTree,
  options: ResolvedOptions,
  paramParsersMap: ParamParsersMap,
): Promise<string> {
  const [
    { generateRouteNamedMap },
    { generateRouteTreeMap },
    { generateRouteFileInfoMap },
    { generateDTS },
    {
      generateParamParsersTypesDeclarations,
      generateParamParserCustomType,
      warnMissingParamParsers,
    },
  ] = await Promise.all([
    import('../codegen/generateRouteMap'),
    import('../codegen/generateRouteTree'),
    import('../codegen/generateRouteFileInfoMap'),
    import('../codegen/generateDts'),
    import('../codegen/generateParamParsers'),
  ]);

  if (options.experimental.paramParsers?.dir.length) {
    warnMissingParamParsers(routeTree, paramParsersMap);
  }

  return generateDTS({
    routeNamedMap: generateRouteNamedMap(routeTree, options, paramParsersMap),
    routeTreeMap: generateRouteTreeMap(routeTree),
    routeFileInfoMap: generateRouteFileInfoMap(routeTree, { root: options.root }),
    paramsTypesDeclaration: generateParamParsersTypesDeclarations(paramParsersMap),
    customParamsType: generateParamParserCustomType(paramParsersMap),
  });
}
