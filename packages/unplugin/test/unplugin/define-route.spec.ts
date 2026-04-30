import { describe, expect, it } from 'vitest';
import { definePageTransform, extractDefinePageInfo } from '../../src/core/definePage';

describe('defineRoute macro support', () => {
  it('extracts static route info from defineRoute()', () => {
    const code = `
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  name: 'users-id',
  path: '/users/:id',
  alias: ['/u/:id'],
})
`;

    const info = extractDefinePageInfo(code, '/src/pages/users/[id].tsx');

    expect(info).toMatchObject({
      name: 'users-id',
      path: '/users/:id',
      alias: ['/u/:id'],
      hasRemainingProperties: false,
    });
  });

  it('extracts query param queryKey option from defineRoute()', () => {
    const code = `
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  name: 'users-search',
  params: {
    query: {
      id: { queryKey: 'uid', parser: 'int', required: true },
    },
  },
})
`;

    const info = extractDefinePageInfo(code, '/src/pages/users/search.tsx');
    expect(info?.params?.query?.id).toMatchObject({
      queryKey: 'uid',
      parser: 'int',
      required: true,
    });
  });

  it('warns when path param parser is not a string literal', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const code = `
import { defineRoute } from 'essor-router/experimental'
const parserName = 'int'
export const route = defineRoute({
  params: {
    path: {
      id: parserName,
    },
  },
})
`;
      const info = extractDefinePageInfo(code, '/src/pages/users/[id].tsx');
      expect(info?.params?.path).toEqual({});
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('path param parser "id" must be a string literal'),
      );
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('marks validateSearch/loader/start for typed route tree generation', () => {
    const code = `
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  name: 'search',
  validateSearch: (input) => ({ q: String(input.q ?? '') }),
  loader: async () => ({ ok: true }),
  beforeLoad: () => ({ auth: true }),
  start: { ssr: true, preload: 'intent' },
})
`;

    const info = extractDefinePageInfo(code, '/src/pages/search.tsx');

    expect(info).toMatchObject({
      name: 'search',
      validateSearch: true,
      loader: true,
      beforeLoad: true,
      start: { ssr: true, preload: 'intent' },
      hasRemainingProperties: true,
    });
  });

  it('removes defineRoute statement from transformed source', async () => {
    const code = `
import { defineRoute } from 'essor-router/experimental'
const keep = 1
const route = defineRoute({ name: 'home' })
export default function Home() { return keep }
`;

    const result = await definePageTransform({
      code,
      id: '/src/pages/index.tsx',
    });

    const transformed = typeof result === 'string' ? result : result?.code || '';
    expect(transformed).toContain('const keep = 1');
    expect(transformed).not.toContain('const route = defineRoute');
    expect(transformed).toContain('export default function Home');
  });

  it('extracts defineRoute object with definePage query lang variants', async () => {
    const code = `
import { defineRoute } from 'essor-router/experimental'
const role = 'admin'
const route = defineRoute({
  name: 'home',
  meta: { role },
})
`;

    const result = await definePageTransform({
      code,
      id: '/src/pages/index.tsx?definePage&lang.tsx',
    });

    const transformed = typeof result === 'string' ? result : result?.code || '';
    expect(transformed).toContain('export default {');
    expect(transformed).toContain(`name: 'home'`);
    expect(transformed).toContain('meta: { role }');
    expect(transformed).not.toContain('defineRoute(');
  });
});
