import { describe, expect, it } from 'vitest';
import {
  FixedResolverParamError,
  type MatcherPatternPath,
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
  MatcherPatternQueryParam,
  PARAM_PARSER_INT,
  createFixedResolver,
  normalizeRouteRecord,
} from '../src';
import { START_LOCATION_NORMALIZED } from '../src/types';

describe('fixed resolver', () => {
  it('matches static and dynamic routes without scanning unrelated branches', () => {
    const home = normalizeRouteRecord({
      name: 'home',
      path: new MatcherPatternPathStatic('/home'),
      component: {} as any,
    });
    const user = normalizeRouteRecord({
      name: 'user',
      path: new MatcherPatternPathDynamic(
        /^\/users\/([^/]+?)$/i,
        { id: [PARAM_PARSER_INT] },
        ['users', 1],
      ),
      component: {} as any,
    });
    const resolver = createFixedResolver([home, user]);

    expect(resolver.resolve({ path: '/home' }, START_LOCATION_NORMALIZED)).toMatchObject({
      name: 'home',
      path: '/home',
      params: {},
    });
    expect(resolver.resolve({ path: '/users/42' }, START_LOCATION_NORMALIZED)).toMatchObject({
      name: 'user',
      params: { id: 42 },
    });
    expect(resolver.resolve({ path: '/users/not-number' }, START_LOCATION_NORMALIZED)).toMatchObject(
      {
        matched: [],
      },
    );
  });

  it('treats static path matches as case-insensitive and trailing-slash tolerant', () => {
    const about = normalizeRouteRecord({
      name: 'about',
      path: new MatcherPatternPathStatic('/About'),
      component: {} as any,
    });
    const resolver = createFixedResolver([about]);

    for (const path of ['/About', '/about', '/ABOUT', '/about/']) {
      expect(resolver.resolve({ path }, START_LOCATION_NORMALIZED)).toMatchObject({
        name: 'about',
      });
    }
  });

  it('matches query params and applies defaults', () => {
    const search = normalizeRouteRecord({
      name: 'search',
      path: new MatcherPatternPathStatic('/search'),
      query: [
        new MatcherPatternQueryParam('page', 'p', 'value', PARAM_PARSER_INT, 1),
        new MatcherPatternQueryParam('q', 'q', 'value', undefined, undefined, true),
      ],
      component: {} as any,
    });
    const resolver = createFixedResolver([search]);

    expect(
      resolver.resolve({ path: '/search', query: { q: 'router' } }, START_LOCATION_NORMALIZED),
    ).toMatchObject({
      name: 'search',
      params: { page: 1, q: 'router' },
    });
    expect(resolver.resolve({ path: '/search' }, START_LOCATION_NORMALIZED)).toMatchObject({
      matched: [],
    });
  });

  it('resolves default values lazily when provided as a function', () => {
    let invocations = 0;
    const search = normalizeRouteRecord({
      name: 'search',
      path: new MatcherPatternPathStatic('/search'),
      query: [
        new MatcherPatternQueryParam('page', 'p', 'value', PARAM_PARSER_INT, () => {
          invocations++;
          return 7;
        }),
      ],
      component: {} as any,
    });
    const resolver = createFixedResolver([search]);

    expect(resolver.resolve({ path: '/search' }, START_LOCATION_NORMALIZED)).toMatchObject({
      params: { page: 7 },
    });
    expect(invocations).toBe(1);
  });

  it('supports query params with format=array', () => {
    const list = normalizeRouteRecord({
      name: 'list',
      path: new MatcherPatternPathStatic('/list'),
      query: [
        new MatcherPatternQueryParam('tags', 'tag', 'array', undefined, undefined, false),
      ],
      component: {} as any,
    });
    const resolver = createFixedResolver([list]);

    expect(
      resolver.resolve({ path: '/list', query: { tag: 'a' } }, START_LOCATION_NORMALIZED),
    ).toMatchObject({
      params: { tags: ['a'] },
    });
    expect(
      resolver.resolve(
        { path: '/list', query: { tag: ['a', 'b'] } },
        START_LOCATION_NORMALIZED,
      ),
    ).toMatchObject({
      params: { tags: ['a', 'b'] },
    });
  });

  it('limits path matching to records sharing a concrete segment', () => {
    const visited: string[] = [];
    const resolver = createFixedResolver([
      normalizeRouteRecord({
        name: 'settings',
        path: new CountingPattern('/settings', visited, () => null),
        component: {} as any,
      }),
      normalizeRouteRecord({
        name: 'tenant-orders',
        path: new CountingPattern('/:tenant/orders', visited, () => null),
        component: {} as any,
      }),
      normalizeRouteRecord({
        name: 'tenant-items',
        path: new CountingPattern('/:tenant/items', visited, () => ({ tenant: 'acme' })),
        component: {} as any,
      }),
    ]);

    expect(resolver.resolve({ path: '/acme/items' }, START_LOCATION_NORMALIZED)).toMatchObject({
      name: 'tenant-items',
      params: { tenant: 'acme' },
    });
    expect(visited).toEqual(['/:tenant/items']);
  });

  it('keeps root and fully dynamic routes available as fallback candidates', () => {
    const resolver = createFixedResolver([
      normalizeRouteRecord({
        name: 'root',
        path: new MatcherPatternPathStatic('/'),
        component: {} as any,
      }),
      normalizeRouteRecord({
        name: 'slug',
        path: new MatcherPatternPathDynamic(/^\/([^/]+?)$/i, { slug: [] }, [1]),
        component: {} as any,
      }),
    ]);

    expect(resolver.resolve({ path: '/' }, START_LOCATION_NORMALIZED)).toMatchObject({
      name: 'root',
    });
    expect(resolver.resolve({ path: '/about' }, START_LOCATION_NORMALIZED)).toMatchObject({
      name: 'slug',
      params: { slug: 'about' },
    });
  });

  it('uses original records, not aliases, for named resolution', () => {
    const home = normalizeRouteRecord({
      name: 'home',
      path: new MatcherPatternPathStatic('/home'),
      component: {} as any,
    });
    const homeAlias = normalizeRouteRecord({
      ...home,
      path: new MatcherPatternPathStatic('/start'),
      aliasOf: home,
    } as any);
    const resolver = createFixedResolver([home, homeAlias]);

    expect(resolver.resolve({ path: '/start' }, START_LOCATION_NORMALIZED)).toMatchObject({
      name: 'home',
      path: '/start',
    });
    expect(resolver.resolve({ name: 'home' }, START_LOCATION_NORMALIZED)).toMatchObject({
      name: 'home',
      path: '/home',
    });
  });

  it('builds the matched chain from parent records', () => {
    const parent = normalizeRouteRecord({
      name: 'parent',
      path: new MatcherPatternPathStatic('/parent'),
      component: {} as any,
      meta: { layout: 'parent' },
    });
    const child = normalizeRouteRecord({
      name: 'child',
      path: new MatcherPatternPathStatic('/parent/child'),
      component: {} as any,
      meta: { breadcrumb: 'child' },
      parent,
    });
    const resolver = createFixedResolver([parent, child]);

    const resolved = resolver.resolve({ path: '/parent/child' }, START_LOCATION_NORMALIZED);
    expect(resolved.matched).toHaveLength(2);
    expect(resolved.matched[0]?.name).toBe('parent');
    expect(resolved.matched[1]?.name).toBe('child');
    expect(resolved.meta).toMatchObject({ layout: 'parent', breadcrumb: 'child' });
  });

  it('falls back to the current location when neither name nor path is provided', () => {
    const user = normalizeRouteRecord({
      name: 'user',
      path: new MatcherPatternPathDynamic(
        /^\/users\/([^/]+?)$/i,
        { id: [PARAM_PARSER_INT] },
        ['users', 1],
      ),
      component: {} as any,
    });
    const resolver = createFixedResolver([user]);
    const current = resolver.resolve({ path: '/users/1' }, START_LOCATION_NORMALIZED);

    const resolved = resolver.resolve(
      { params: { id: 7 } },
      { ...START_LOCATION_NORMALIZED, ...current },
    );
    expect(resolved).toMatchObject({ name: 'user', params: { id: 7 } });
  });

  it('throws FixedResolverParamError when stringifying without a required param', () => {
    const user = normalizeRouteRecord({
      name: 'user',
      path: new MatcherPatternPathDynamic(/^\/users\/([^/]+?)$/i, { id: [] }, ['users', 1]),
      component: {} as any,
    });
    const resolver = createFixedResolver([user]);
    expect(() => resolver.resolve({ name: 'user', params: {} }, START_LOCATION_NORMALIZED)).toThrow(
      FixedResolverParamError,
    );
  });
});

class CountingPattern implements MatcherPatternPath {
  constructor(
    readonly source: string,
    private readonly visited: string[],
    private readonly matchResult: (path: string) => Record<string, string> | null,
  ) {}

  match(path: string) {
    this.visited.push(this.source);
    return this.matchResult(path);
  }

  stringify() {
    return this.source;
  }
}
