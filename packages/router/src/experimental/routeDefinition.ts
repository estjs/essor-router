import type { RouteLocationNormalized, RouteRecordRaw } from '../types';

/**
 * Helper to define page properties with file-based routing.
 * **Doesn't do anything**, used for types only.
 *
 * @param route - route information to be added to this page
 *
 * @internal
 */
export const definePage = (route: DefinePage) => route;
export const defineRoute = (route: DefinePage) => route;
export const defineStartRoute = (route: DefinePage) => route;

export type DefineRouteSearchValidator<TInput = unknown, TOutput = TInput> = (
  input: TInput,
) => TOutput;

export interface DefineRouteLoaderContext<
  TParams extends Record<string, unknown> = Record<string, unknown>,
  TSearch = unknown,
> {
  params: TParams;
  route: RouteLocationNormalized;
  search: TSearch;
  signal?: AbortSignal;
  context?: unknown;
}

export type DefineRouteLoader<
  TData = unknown,
  TParams extends Record<string, unknown> = Record<string, unknown>,
  TSearch = unknown,
> = (ctx: DefineRouteLoaderContext<TParams, TSearch>) => Promise<TData> | TData;

export interface DefineRouteStartOptions {
  ssr?: boolean;
  prerender?: boolean;
  prerenderPaths?: string[] | (() => string[] | Promise<string[]>);
  preload?: 'intent' | 'render' | 'viewport';
}

/**
 * Type to define a page. Can be augmented to add custom properties.
 */
export interface DefinePage extends Partial<
  Omit<RouteRecordRaw, 'children' | 'components' | 'component' | 'name'>
> {
  /**
   * A route name. If not provided, the name will be generated based on the file path.
   * Can be set to `false` to remove the name from types.
   */
  name?: string | false;

  /**
   * Custom parameters for the route. Requires `experimental.paramParsers` enabled.
   *
   * @experimental
   */
  params?: {
    path?: Record<string, ParamParserType>;

    /**
     * Parameters extracted from the query.
     */
    query?: Record<string, DefinePageQueryParamOptions | ParamParserType>;
  };

  /**
   * Search/schema validator. TanStack-compatible shape.
   */
  validateSearch?: DefineRouteSearchValidator<any, any>;

  /**
   * Route loader. TanStack Start-compatible shape.
   */
  loader?: DefineRouteLoader<any, any, any>;

  /**
   * Route pre-navigation hook. TanStack Start-compatible shape.
   */
  beforeLoad?: DefineRouteLoader<any, any, any>;

  /**
   * Start metadata for future SSR/preload adapters.
   */
  start?: DefineRouteStartOptions;
}

export type InferRouteSearch<TRoute> = TRoute extends {
  validateSearch: (...args: any[]) => infer TResult;
}
  ? TResult
  : Record<string, unknown>;

export type InferRouteLoaderData<TRoute> = TRoute extends {
  loader: (...args: any[]) => infer TResult;
}
  ? Awaited<TResult>
  : unknown;

export type InferRouteBeforeLoadData<TRoute> = TRoute extends {
  beforeLoad: (...args: any[]) => infer TResult;
}
  ? Awaited<TResult>
  : unknown;

export type InferRouteStartOptions<TRoute> = TRoute extends { start: infer T }
  ? T
  : Record<never, never>;

export type InferRouteDefinitionFromDefinePageModule<TModule> = TModule extends {
  default: infer TRoute;
}
  ? TRoute
  : never;

export interface RouteTreeNodeInfo<
  Name extends string,
  Path extends string,
  Search = Record<string, unknown>,
  LoaderData = unknown,
  BeforeLoadData = unknown,
  StartOptions = Record<never, never>,
> {
  name: Name;
  path: Path;
  search: Search;
  loaderData: LoaderData;
  beforeLoadData: BeforeLoadData;
  start: StartOptions;
}

export type ParamParserType_Native = 'int' | 'bool';

export type ParamParserType = ParamParserType_Native | string;

/**
 * Configures how to extract a route param from a specific query parameter.
 */
export interface DefinePageQueryParamOptions<T = unknown> {
  /**
   * The type of the query parameter. Allowed values are native param parsers
   * and any parser in the params folder. If not provided, the value will kept
   * as is.
   */
  parser?: ParamParserType;

  /**
   * Name of the query key to read from the URL.
   * Defaults to the object key in `params.query`.
   */
  queryKey?: string;

  /**
   * Default value if the query parameter is missing or if the match fails
   * (e.g. a invalid number is passed to the int param parser). If not provided
   * and the param is not required, the route will match with undefined.
   */
  default?: (() => T) | T;

  /**
   * How to format the query parameter value.
   *
   * - 'value' - keep the first value only and pass that to parser
   * - 'array' - keep all values (even one or none) as an array and pass that to parser
   *
   * @default 'value'
   */
  format?: 'value' | 'array';

  /**
   * Whether this query parameter is required. If true and the parameter is
   * missing (and no default is provided), the route will not match.
   *
   * @default false
   */
  required?: boolean;
}
