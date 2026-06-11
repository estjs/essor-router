import { ErrorTypes, type MatcherError, createRouterError } from './core/errors';
import { normalizeQuery } from './core/query';
import { assign, isArray } from './utils';
import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from './core/query';
import type {
  MatcherLocation,
  MatcherLocationRaw,
  RouteParams,
  RouteRecordName,
  RouteRecordRaw,
} from './types';
import type { RouteRecordNormalized } from './matcher/types';

type ParserInput = string | Array<string | null> | null | undefined;
type ParserOutput = string | string[] | number | boolean | null | undefined | unknown;

export interface ParamParser<T = ParserOutput> {
  parse?: (value: ParserInput, options?: { format?: 'value' | 'array' }) => T;
  get?: (value: T) => T;
}

type ParamParserLike = ParamParser | ((value: ParserInput) => ParserOutput);
type PathParamOptions = [parser?: ParamParserLike, repeatable?: boolean, optional?: boolean];

export const PARAM_PARSER_INT: ParamParser<number | number[] | undefined> = {
  parse(value) {
    return parseMappedValue(value, (entry) => {
      if (entry == null || entry === '') return undefined;
      const parsed = Number.parseInt(entry, 10);
      return Number.isNaN(parsed) || String(parsed) !== entry ? undefined : parsed;
    });
  },
  get(value) {
    return value;
  },
};

export const PARAM_PARSER_BOOL: ParamParser<boolean | boolean[] | undefined> = {
  parse(value) {
    return parseMappedValue(value, (entry) => {
      if (entry === 'true') return true;
      if (entry === 'false') return false;
      return undefined;
    });
  },
  get(value) {
    return value;
  },
};

export type MatcherPatternPathPart = string | number | Array<string | number>;

export interface MatcherPatternPathParamKey {
  name: string;
  optional: boolean;
}

export interface MatcherPatternPath {
  readonly source: string;
  readonly keys?: readonly MatcherPatternPathParamKey[];
  match(path: string): RouteParams | null;
  stringify(params: RouteParams): string;
}

/**
 * Matches a static path. Comparison is case-insensitive and ignores a trailing
 * slash so `/About`, `/about` and `/about/` all resolve to the same record.
 */
export class MatcherPatternPathStatic implements MatcherPatternPath {
  readonly source: string;
  readonly keys: readonly MatcherPatternPathParamKey[] = [];
  private readonly comparable: string;

  constructor(path: string) {
    this.source = path;
    this.comparable = normalizeStaticPath(path);
  }

  match(path: string): RouteParams | null {
    return normalizeStaticPath(path) === this.comparable ? {} : null;
  }

  stringify(): string {
    return this.source;
  }
}

export class MatcherPatternPathDynamic implements MatcherPatternPath {
  readonly source: string;
  readonly keys: readonly MatcherPatternPathParamKey[];
  private readonly paramNames: string[];
  private readonly re: RegExp;

  constructor(
    re: RegExp,
    private readonly params: Record<string, PathParamOptions>,
    private readonly parts: MatcherPatternPathPart[],
  ) {
    // Strip the global/sticky flags: `match()` calls `exec()` up to twice on the
    // same instance, and with `g`/`y` the regex's `lastIndex` would carry over
    // between calls and make the second `exec()` start mid-string (or miss).
    this.re = re.global || re.sticky ? new RegExp(re.source, re.flags.replaceAll(/[gy]/g, '')) : re;
    this.paramNames = Object.keys(params);
    this.keys = this.paramNames.map((name) => ({
      name,
      optional: Boolean(params[name]?.[2]),
    }));
    this.source = renderPathTemplate(parts, this.paramNames, params);
  }

  match(path: string): RouteParams | null {
    const match =
      this.re.exec(path) || (path !== '/' ? this.re.exec(path.replace(/\/+$/, '')) : null);
    if (!match) return null;

    const params: Record<string, any> = {};
    for (let i = 0; i < this.paramNames.length; i++) {
      const name = this.paramNames[i]!;
      const [parser, repeatable, optional] = this.params[name] || [];
      const raw = match[i + 1] || '';
      let value: unknown = repeatable && raw ? raw.split('/') : raw;

      if (parser) {
        const parsed = parseValue(parser, value as ParserInput, {
          format: repeatable ? 'array' : 'value',
        });
        if (parsed === undefined) {
          if (!optional) return null;
          value = null;
        } else {
          value = parsed;
        }
      }

      params[name] = value;
    }

    return params as RouteParams;
  }

  stringify(params: RouteParams): string {
    const path = renderPathFromParts(this.parts, this.paramNames, this.params, params);
    return path || '/';
  }
}

export class MatcherPatternQueryParam {
  constructor(
    readonly paramName: string,
    readonly queryKey: string = paramName,
    readonly format: 'value' | 'array' = 'value',
    readonly parser?: ParamParserLike,
    readonly defaultValue?: unknown,
    readonly required = false,
  ) {}

  match(query: LocationQuery): { matched: true; value: unknown } | { matched: false } {
    const raw = getQueryValue(query, this.queryKey, this.format);
    const hasValue = raw !== undefined;

    if (!hasValue) {
      if (this.defaultValue !== undefined) {
        return { matched: true, value: resolveDefaultValue(this.defaultValue) };
      }
      return this.required ? { matched: false } : { matched: true, value: undefined };
    }

    const value = this.parser ? parseValue(this.parser, raw, { format: this.format }) : raw;
    if (value === undefined) {
      if (this.defaultValue !== undefined) {
        return { matched: true, value: resolveDefaultValue(this.defaultValue) };
      }
      return this.required ? { matched: false } : { matched: true, value: undefined };
    }

    return { matched: true, value };
  }
}

export type FixedResolverRecordInput = Omit<RouteRecordNormalized, 'path'> & {
  path: MatcherPatternPath;
  parent?: FixedResolverRecordInput;
  query?: MatcherPatternQueryParam[];
};

export type FixedResolverRecordRaw = Omit<RouteRecordRaw, 'path'> & {
  path: MatcherPatternPath;
  aliasOf?: FixedResolverRecordInput;
  parent?: FixedResolverRecordInput;
  query?: MatcherPatternQueryParam[];
};

const ALIAS_CYCLE_GUARD_LIMIT = 64;

interface FixedResolverRecord {
  pattern: MatcherPatternPath;
  record: RouteRecordNormalized;
  parent?: FixedResolverRecord;
  query: MatcherPatternQueryParam[];
  /** Cached merged meta walking up the parent chain. */
  mergedMeta: Record<string | number | symbol, unknown>;
  /** Cached matched chain (root → leaf), shared across resolves. */
  matched: RouteRecordNormalized[];
}

interface SegmentIndex {
  bySegment: Map<string, FixedResolverRecord[]>;
  fallback: FixedResolverRecord[];
  order: Map<FixedResolverRecord, number>;
}

export interface FixedRouteResolver {
  resolve(
    location: MatcherLocationRaw & { query?: LocationQueryRaw },
    currentLocation: MatcherLocation,
  ): MatcherLocation;
}

export function createFixedResolver(records: FixedResolverRecordInput[]): FixedRouteResolver {
  const nodeMap = new Map<FixedResolverRecordInput, FixedResolverRecord>();
  const matchableRecords = records.map((record) => normalizeFixedRecord(record, nodeMap));
  const segmentIndex = createSegmentIndex(matchableRecords);
  const nameMap = new Map<RouteRecordName, FixedResolverRecord>();

  for (const node of matchableRecords) {
    if (node.record.name && !node.record.aliasOf) {
      nameMap.set(node.record.name, node);
    }
  }

  function resolve(
    location: Readonly<MatcherLocationRaw & { query?: LocationQueryRaw }>,
    currentLocation: Readonly<MatcherLocation>,
  ): MatcherLocation {
    if ('name' in location && location.name) {
      const node = nameMap.get(location.name);
      if (!node) {
        throw createRouterError<MatcherError>(ErrorTypes.MATCHER_NOT_FOUND, { location });
      }

      const queryParams = matchQueryParams(node, normalizeQuery(location.query));
      if (!queryParams) {
        throw createRouterError<MatcherError>(ErrorTypes.MATCHER_NOT_FOUND, { location });
      }

      const params = assign(
        pickParams(currentLocation.params, getInheritableParamNames(node)),
        location.params || {},
        queryParams,
      ) as RouteParams;
      return createMatcherLocation(node, node.pattern.stringify(params), params);
    }

    if (location.path != null) {
      const query = normalizeQuery(location.query);
      for (const node of getPathCandidates(segmentIndex, location.path)) {
        const pathParams = node.pattern.match(location.path);
        if (!pathParams) continue;
        const queryParams = matchQueryParams(node, query);
        if (!queryParams) continue;
        return createMatcherLocation(
          node,
          location.path,
          assign({}, pathParams, queryParams) as RouteParams,
        );
      }

      return {
        name: undefined,
        path: location.path,
        params: {},
        matched: [],
        meta: {},
      };
    }

    const node = currentLocation.name
      ? nameMap.get(currentLocation.name)
      : getPathCandidates(segmentIndex, currentLocation.path).find((record) =>
          record.pattern.match(currentLocation.path),
        );

    if (!node) {
      throw createRouterError<MatcherError>(ErrorTypes.MATCHER_NOT_FOUND, {
        location,
        currentLocation,
      });
    }

    const params = assign({}, currentLocation.params, location.params || {}) as RouteParams;
    return createMatcherLocation(node, node.pattern.stringify(params), params);
  }

  return { resolve };
}

function createSegmentIndex(records: FixedResolverRecord[]): SegmentIndex {
  const bySegment = new Map<string, FixedResolverRecord[]>();
  const fallback: FixedResolverRecord[] = [];
  const order = new Map<FixedResolverRecord, number>();

  records.forEach((record, index) => {
    order.set(record, index);
    const segments = getConcretePathSegments(record.pattern.source);
    if (segments.length === 0) {
      fallback.push(record);
      return;
    }

    for (const segment of segments) {
      const bucket = bySegment.get(segment);
      if (bucket) {
        bucket.push(record);
      } else {
        bySegment.set(segment, [record]);
      }
    }
  });

  return { bySegment, fallback, order };
}

function getPathCandidates(index: SegmentIndex, path: string): FixedResolverRecord[] {
  const seen = new Set<FixedResolverRecord>();
  const candidates: FixedResolverRecord[] = [];

  const add = (record: FixedResolverRecord) => {
    if (seen.has(record)) return;
    seen.add(record);
    candidates.push(record);
  };

  for (const segment of getConcretePathSegments(path)) {
    const bucket = index.bySegment.get(segment);
    if (bucket) {
      for (const record of bucket) add(record);
    }
  }

  for (const record of index.fallback) add(record);

  return candidates.sort((a, b) => index.order.get(a)! - index.order.get(b)!);
}

function getConcretePathSegments(path: string): string[] {
  const seen = new Set<string>();
  const segments: string[] = [];

  for (const segment of path.split('/')) {
    if (!isConcretePathSegment(segment)) continue;
    const normalized = segment.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    segments.push(normalized);
  }

  return segments;
}

function getInheritableParamNames(node: FixedResolverRecord): string[] | null {
  const keys = node.pattern.keys;
  if (!keys) return null;

  const names = new Set<string>();
  for (const key of keys) {
    if (!key.optional) names.add(key.name);
  }

  if (node.parent) {
    const parentKeys = node.parent.pattern.keys;
    if (!parentKeys) return null;

    for (const key of parentKeys) {
      if (key.optional) names.add(key.name);
    }
  }

  return [...names];
}

function pickParams(params: RouteParams, names: string[] | null): RouteParams {
  if (names === null) return assign({}, params) as RouteParams;

  const picked = {} as RouteParams;
  for (const name of names) {
    if (name in params) picked[name] = params[name];
  }
  return picked;
}

function isConcretePathSegment(segment: string): boolean {
  return segment !== '' && !segment.includes(':') && !segment.includes('*');
}

export function normalizeRouteRecord(record: FixedResolverRecordRaw): FixedResolverRecordInput {
  const { path, parent, query, ...routeRecord } = record;
  const routeRecordForProps = { ...routeRecord, path: path.source } as RouteRecordRaw;
  const normalized = {
    path,
    redirect: routeRecord.redirect,
    name: routeRecord.name,
    meta: routeRecord.meta || {},
    validateSearch: routeRecord.validateSearch,
    loader: routeRecord.loader,
    beforeLoad: routeRecord.beforeLoad,
    start: routeRecord.start,
    beforeEnter: routeRecord.beforeEnter,
    beforeLeave: routeRecord.beforeLeave,
    aliasOf: routeRecord.aliasOf,
    props: normalizeRecordProps(routeRecordForProps),
    children: routeRecord.children || [],
    instances: {},
    leaveGuards: undefined,
    updateGuards: undefined,
    enterCallbacks: {},
    components:
      'components' in routeRecord
        ? routeRecord.components || null
        : routeRecord.component && { default: routeRecord.component },
    parent,
    query,
  };
  return normalized as FixedResolverRecordInput;
}

function normalizeFixedRecord(
  input: FixedResolverRecordInput,
  nodeMap: Map<FixedResolverRecordInput, FixedResolverRecord>,
  visiting: Set<FixedResolverRecordInput> = new Set(),
): FixedResolverRecord {
  const existing = nodeMap.get(input);
  if (existing) return existing;

  if (visiting.has(input) || visiting.size >= ALIAS_CYCLE_GUARD_LIMIT) {
    throw new Error('Detected an alias/parent cycle while normalizing route records');
  }
  visiting.add(input);

  const pattern = input.path;
  const record = {
    ...input,
    path: pattern.source,
  } as RouteRecordNormalized;

  const parentInput = input.parent;
  const parent = parentInput ? normalizeFixedRecord(parentInput, nodeMap, visiting) : undefined;
  const aliasOf = (input as { aliasOf?: FixedResolverRecordInput }).aliasOf;
  if (aliasOf) {
    record.aliasOf = normalizeFixedRecord(aliasOf, nodeMap, visiting).record;
  }

  delete (record as { parent?: unknown }).parent;
  delete (record as { query?: unknown }).query;

  const node: FixedResolverRecord = {
    pattern,
    record,
    parent,
    query: input.query || [],
    mergedMeta: {},
    matched: [],
  };

  // Build matched chain root→leaf using cached parent matched.
  node.matched = parent ? [...parent.matched, record] : [record];
  // Cache merged meta over the matched chain.
  node.mergedMeta = node.matched.reduce<Record<string | number | symbol, unknown>>(
    (meta, r) => assign(meta, r.meta),
    {},
  );

  nodeMap.set(input, node);
  visiting.delete(input);
  return node;
}

function normalizeRecordProps(record: RouteRecordRaw): Record<string, any> {
  const propsObject = {} as Record<string, any>;
  const props = record.props || false;
  if ('component' in record) {
    propsObject.default = props;
  } else {
    for (const name in record.components) {
      propsObject[name] =
        props && typeof props === 'object' && !isArray(props) ? props[name] : props;
    }
  }

  return propsObject;
}

function createMatcherLocation(
  node: FixedResolverRecord,
  path: string,
  params: RouteParams,
): MatcherLocation {
  return {
    name: node.record.name,
    path,
    params,
    matched: node.matched,
    meta: node.mergedMeta,
  };
}

function matchQueryParams(
  node: FixedResolverRecord,
  query: LocationQuery,
): Record<string, unknown> | null {
  if (node.query.length === 0) return {};

  const params: Record<string, unknown> = {};
  for (const matcher of node.query) {
    const result = matcher.match(query);
    if (!result.matched) return null;
    if (result.value !== undefined) {
      params[matcher.paramName] = result.value;
    }
  }
  return params;
}

function parseValue(
  parser: ParamParserLike,
  value: ParserInput,
  options?: { format?: 'value' | 'array' },
): ParserOutput {
  return typeof parser === 'function' ? parser(value) : parser.parse?.(value, options);
}

function parseMappedValue<T>(
  value: ParserInput,
  parseEntry: (entry: string) => T | undefined,
): T | T[] | undefined {
  if (isArray(value)) {
    const parsedValues: T[] = [];
    for (const entry of value) {
      if (entry == null) return undefined;
      const parsed = parseEntry(entry);
      if (parsed === undefined) return undefined;
      parsedValues.push(parsed);
    }
    return parsedValues;
  }

  if (value == null) return undefined;
  return parseEntry(value);
}

function normalizeStaticPath(path: string): string {
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return normalized.toLowerCase();
}

function getQueryValue(
  query: LocationQuery,
  key: string,
  format: 'value' | 'array',
): LocationQueryValue | LocationQueryValue[] | undefined {
  const value = query[key];
  if (value === undefined) return undefined;
  if (format === 'array') return isArray(value) ? value : [value];
  return isArray(value) ? value[0] : value;
}

function resolveDefaultValue(value: unknown): unknown {
  return typeof value === 'function' ? (value as () => unknown)() : value;
}

function renderPathTemplate(
  parts: MatcherPatternPathPart[],
  paramNames: string[],
  params: Record<string, PathParamOptions>,
): string {
  let paramIndex = 0;
  const segments = parts.map((part) =>
    renderPart(part, () => {
      const name = paramNames[paramIndex++] || 'pathMatch';
      const [, repeatable, optional] = params[name] || [];
      return `:${name}${repeatable ? '+' : optional ? '?' : ''}`;
    }),
  );
  return `/${segments.filter(Boolean).join('/')}`.replace(/\/+$/, '') || '/';
}

function renderPart(part: MatcherPatternPathPart, renderParam: () => string): string {
  if (typeof part === 'string') return part;
  if (typeof part === 'number') return renderParam();
  return part.map((subPart) => (typeof subPart === 'string' ? subPart : renderParam())).join('');
}

function renderPathFromParts(
  parts: MatcherPatternPathPart[],
  paramNames: string[],
  paramOptions: Record<string, PathParamOptions>,
  params: RouteParams,
): string {
  let paramIndex = 0;
  const segments: string[] = [];

  for (const part of parts) {
    const segment = renderPart(part, () => {
      const name = paramNames[paramIndex++] || 'pathMatch';
      return renderParamValue(name, paramOptions[name] || [], params);
    });
    if (segment) segments.push(segment);
  }

  return `/${segments.join('/')}`;
}

function renderParamValue(name: string, options: PathParamOptions, params: RouteParams): string {
  const [, repeatable, optional] = options;
  const value = params[name];

  if (value == null || value === '') {
    if (optional) return '';
    throw new FixedResolverParamError(`Missing required param "${name}"`);
  }

  if (isArray(value)) {
    if (!repeatable) {
      throw new FixedResolverParamError(
        `Provided param "${name}" is an array but it is not repeatable`,
      );
    }
    if (value.length === 0 && !optional) {
      throw new FixedResolverParamError(`Missing required param "${name}"`);
    }
    return value.join('/');
  }

  return String(value);
}

/**
 * Programmer error thrown when stringifying a route with invalid params.
 * Distinct from MatcherError (which signals MATCHER_NOT_FOUND during path
 * resolution); this one means the caller asked the resolver to render a URL
 * with params that don't satisfy the route shape.
 */
export class FixedResolverParamError extends Error {
  override readonly name = 'FixedResolverParamError';
}
