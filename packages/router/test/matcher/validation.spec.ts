import { describe, expect, it } from 'vitest';
import { createRouterMatcher } from '../../src/matcher';
import {
  checkMissingParamsInAbsolutePath,
  checkSameParams,
  isRecordChildOf,
} from '../../src/matcher/validation';
import { mockWarn } from '../utils';
import type { RouteRecordRaw } from '../../src/types';

const Dummy = () => null;

describe('matcher validation helpers', () => {
  mockWarn();

  it('warns when alias params do not match original', () => {
    const routes: RouteRecordRaw[] = [
      { path: '/users/:id', name: 'user', component: Dummy, alias: '/users' },
    ];
    const matcher = createRouterMatcher(routes, {});
    const original = matcher.getRecordMatcher('user')!;
    const alias = matcher.getRoutes().find((route) => route.record.aliasOf === original.record)!;

    checkSameParams(original, alias);

    expect('Alias "/users"').toHaveBeenWarned();
  });

  it('warns when absolute child is missing parent params', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/parent/:id',
        name: 'parent',
        component: Dummy,
        children: [{ path: '/child', name: 'child', component: Dummy }],
      },
    ];
    const matcher = createRouterMatcher(routes, {});
    const parent = matcher.getRecordMatcher('parent')!;
    const child = matcher.getRecordMatcher('child')!;

    checkMissingParamsInAbsolutePath(child, parent);

    expect('Absolute path "/child" must have the exact same param named "id"').toHaveBeenWarned();
  });

  it('detects child relationship in matcher tree', () => {
    const routes: RouteRecordRaw[] = [
      {
        path: '/parent',
        name: 'parent',
        component: Dummy,
        children: [{ path: 'child', name: 'child', component: Dummy }],
      },
    ];
    const matcher = createRouterMatcher(routes, {});
    const parent = matcher.getRecordMatcher('parent')!;
    const child = matcher.getRecordMatcher('child')!;

    expect(isRecordChildOf(child, parent)).toBe(true);
    expect(isRecordChildOf(parent, child)).toBe(false);
  });
});
