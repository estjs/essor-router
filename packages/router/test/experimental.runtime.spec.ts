import { describe, expect, it } from 'vitest';
import { _mergeRouteRecord } from '../src/experimental';

describe('experimental runtime helpers', () => {
  it('merges alias/meta/params/start without dropping existing values', () => {
    const merged = _mergeRouteRecord(
      {
        path: '/',
        alias: ['/root'],
        meta: { a: 1 },
        // @ts-expect-error test-only
        params: { query: { page: { parser: 'int' } } },
        // @ts-expect-error test-only
        start: { ssr: true },
      },
      {
        alias: ['/home'],
        meta: { b: 2 },
        // @ts-expect-error test-only
        params: { path: { id: 'int' } },
        // @ts-expect-error test-only
        start: { preload: 'intent' },
      },
    );

    expect(merged.alias).toEqual(['/root', '/home']);
    expect(merged.meta).toEqual({ a: 1, b: 2 });
    // @ts-expect-error test-only
    expect(merged.params).toEqual({
      query: { page: { parser: 'int' } },
      path: { id: 'int' },
    });
    // @ts-expect-error test-only
    expect(merged.start).toEqual({ ssr: true, preload: 'intent' });
  });
});
