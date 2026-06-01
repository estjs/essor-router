import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from '../src';
import { createDom, mockWarn } from './utils';
import type { RouteRecordRaw } from '../src/types';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: {} as any },
  { path: '/foo', name: 'foo', component: {} as any },
  { path: '/bar/:id', name: 'bar', component: {} as any },
];

function newRouter() {
  createDom();
  return createRouter({
    history: createMemoryHistory(),
    routes,
  });
}

describe('routeResolver warnings', () => {
  mockWarn();
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('path + params warning', () => {
    it('warns when using path and non-empty params together', () => {
      const router = newRouter();
      // @ts-expect-error: testing runtime warning when path + params are used together
      router.resolve({ path: '/bar/1', params: { id: '1' } });
      expect('Path "/bar/1" was passed with params but they will be ignored').toHaveBeenWarned();
    });

    it('does not warn when path is used without params', () => {
      const router = newRouter();
      const r = router.resolve({ path: '/foo' });
      expect(r.path).toBe('/foo');
      expect('params but they will be ignored').not.toHaveBeenWarned();
    });

    it('does not warn when params is empty', () => {
      const router = newRouter();
      // @ts-expect-error: testing params: {} does not trigger warning
      const r = router.resolve({ path: '/foo', params: {} });
      expect(r.path).toBe('/foo');
      expect('params but they will be ignored').not.toHaveBeenWarned();
    });
  });

  describe('hash format warning', () => {
    it('warns when hash does not start with #', () => {
      const router = newRouter();
      router.resolve({ name: 'foo', hash: 'missing-hash' });
      expect('A `hash` should always start with the character "#"').toHaveBeenWarned();
    });

    it('does not warn when hash starts with #', () => {
      const router = newRouter();
      const r = router.resolve({ name: 'foo', hash: '#section' });
      expect(r.hash).toBe('#section');
      expect('should always start with the character "#"').not.toHaveBeenWarned();
    });

    it('does not warn when hash is empty string', () => {
      const router = newRouter();
      const r = router.resolve({ name: 'foo', hash: '' });
      expect(r.hash).toBe('');
      expect('should always start with the character "#"').not.toHaveBeenWarned();
    });
  });

  describe('invalid location warning', () => {
    it('warns when null is passed to resolve', () => {
      const router = newRouter();
      router.resolve(null as any);
      expect('router.resolve() was passed an invalid location').toHaveBeenWarned();
    });

    it('warns when undefined is passed to resolve', () => {
      const router = newRouter();
      router.resolve(undefined as any);
      expect('router.resolve() was passed an invalid location').toHaveBeenWarned();
    });

    it('warns when a number is passed to resolve', () => {
      const router = newRouter();
      router.resolve(42 as any);
      expect('router.resolve() was passed an invalid location').toHaveBeenWarned();
    });
  });

  describe('no-match warning', () => {
    it('warns when no route matches a string path', () => {
      const router = newRouter();
      router.resolve('/does-not-exist');
      expect('No match found for location with path "/does-not-exist"').toHaveBeenWarned();
    });

    it('warns when no route matches an object location', () => {
      const router = newRouter();
      router.resolve({ path: '/not-found' });
      expect('No match found for location with path "/not-found"').toHaveBeenWarned();
    });
  });
});
