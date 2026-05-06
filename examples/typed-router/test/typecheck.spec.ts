import { describe, expectTypeOf, it } from 'vitest';

// In an actual component like src/pages/post/[[id]].tsx,
// the ts-plugin intercepts the 'essor-router' import and narrows the 'useRoute' type.
// We can simulate and assert this narrowing behavior directly on the types generated.
import type { RouteLocationNormalizedTyped, RouteNamedMap } from 'essor-router';

describe('useRoute type inference', () => {
  it('should infer RouteNamedMap with typed parameters', () => {
    // This asserts that RouteNamedMap is successfully augmented from typed-router.d.ts
    // by checking if a known route name resolves to its typed representation.
    type UserRoute = RouteNamedMap['/users/[id]'];
    expectTypeOf<UserRoute['name']>().toEqualTypeOf<'/users/[id]'>();
    expectTypeOf<UserRoute['params']>().toEqualTypeOf<{ id: string }>();

    type PostRoute = RouteNamedMap['/post/[[id]]'];
    expectTypeOf<PostRoute['name']>().toEqualTypeOf<'/post/[[id]]'>();
    expectTypeOf<PostRoute['params']>().toEqualTypeOf<{ id: string | null }>();
  });

  it('should produce RouteLocationNormalizedTyped as a union of all routes', () => {
    // If HasTypedRoutes is true (declaration successfully merged),
    // then RouteLocationNormalizedTyped is a union of all routes instead of the generic Location
    expectTypeOf<RouteLocationNormalizedTyped>().toHaveProperty('name');
    expectTypeOf<RouteLocationNormalizedTyped>().toHaveProperty('params');

    // We can extract a specific route from the union to verify
    type ExtractedPostRoute = Extract<RouteLocationNormalizedTyped, { name: '/post/[[id]]' }>;
    expectTypeOf<ExtractedPostRoute['params']>().toEqualTypeOf<{ id: string | null }>();
  });
});
