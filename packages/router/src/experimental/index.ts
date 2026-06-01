/**
 * Deprecated. The "experimental" exports have graduated to the main
 * package entry. Replace imports from `essor-router/experimental` with
 * imports from `essor-router`. This shim will be removed in the next minor
 * release.
 *
 * @deprecated
 */

/* eslint-disable no-console */
if (typeof __DEV__ === 'undefined' || __DEV__) {
  console.warn(
    '[essor-router] Importing from "essor-router/experimental" is deprecated. ' +
      'Import directly from "essor-router" instead.',
  );
}
/* eslint-enable no-console */

export {
  createFixedResolver,
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
  MatcherPatternQueryParam,
  normalizeRouteRecord,
  PARAM_PARSER_BOOL,
  PARAM_PARSER_INT,
  FixedResolverParamError,
} from '../fixedResolver';
export type {
  FixedResolverRecordRaw,
  FixedResolverRecordInput,
  FixedRouteResolver,
  MatcherPatternPath,
  MatcherPatternPathPart,
  ParamParser,
} from '../fixedResolver';
export { definePage, defineRoute, defineStartRoute } from '../routeDefinition';
export type {
  DefinePage,
  DefinePageQueryParamOptions,
  DefineRouteLoader,
  DefineRouteLoaderContext,
  DefineRouteSearchValidator,
  DefineRouteStartOptions,
  InferRouteBeforeLoadData,
  InferRouteDefinitionFromDefinePageModule,
  InferRouteLoaderData,
  InferRouteSearch,
  InferRouteStartOptions,
  ParamParserType,
  ParamParserType_Native,
  RouteTreeNodeInfo,
} from '../routeDefinition';
export { _mergeRouteRecord } from '../routeRecordMerge';
