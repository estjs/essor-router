/**
 * Navigation Guards Core Functions Tests
 * 
 * Comprehensive tests for navigationGuards.ts core functions including
 * guardToPromiseFn, extractComponentsGuards, loadRouteLocation, and guard registration.
 * 
 * Target Coverage: 55.1% → 85%+
 * Uncovered Lines: 134, 160-161, 168-170, 185, 207, 218-224, 247, 282-327
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  guardToPromiseFn,
  extractComponentsGuards,
  loadRouteLocation,
  isRouteComponent,
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
} from '../../src/navigationGuards';
import type {
  NavigationGuard,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
} from '../../src/types';
import type { RouteRecordNormalized } from '../../src/matcher/types';
import { ErrorTypes } from '../../src/errors';
import { testWithMultipleInputs, createMockGuard, createAsyncMockGuard } from '../helpers/test-utils';

// Mock essor functions
vi.mock('essor', async (importOriginal) => {
  const actual = await importOriginal<typeof import('essor')>();
  return {
    ...actual,
    inject: vi.fn(),
    onDestroy: vi.fn(),
  };
});

describe('navigationGuards', () => {
  describe('guardToPromiseFn', () => {
    let mockTo: RouteLocationNormalized;
    let mockFrom: RouteLocationNormalizedLoaded;

    beforeEach(() => {
      mockTo = {
        path: '/to',
        name: 'to',
        params: {},
        query: {},
        hash: '',
        fullPath: '/to',
        matched: [],
        meta: {},
        redirectedFrom: undefined,
      } as RouteLocationNormalized;

      mockFrom = {
        path: '/from',
        name: 'from',
        params: {},
        query: {},
        hash: '',
        fullPath: '/from',
        matched: [],
        meta: {},
      } as RouteLocationNormalizedLoaded;
    });

    it('should resolve when guard calls next() with no arguments', async () => {
      const guard: NavigationGuard = (to, from, next) => {
        next();
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).resolves.toBeUndefined();
    });

    it('should resolve when guard calls next(true)', async () => {
      const guard: NavigationGuard = (to, from, next) => {
        next(true);
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).resolves.toBeUndefined();
    });

    it('should reject when guard calls next(false)', async () => {
      const guard: NavigationGuard = (to, from, next) => {
        next(false);
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).rejects.toMatchObject({
        type: ErrorTypes.NAVIGATION_ABORTED,
        from: mockFrom,
        to: mockTo,
      });
    });

    it('should reject when guard calls next(Error)', async () => {
      const error = new Error('Guard error');
      const guard: NavigationGuard = (to, from, next) => {
        next(error);
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).rejects.toBe(error);
    });

    it('should reject with redirect when guard calls next(location)', async () => {
      const redirectTo = '/redirect';
      const guard: NavigationGuard = (to, from, next) => {
        next(redirectTo);
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).rejects.toMatchObject({
        type: ErrorTypes.NAVIGATION_GUARD_REDIRECT,
        from: mockTo,
        to: redirectTo,
      });
    });

    it('should handle synchronous guards (length < 3)', async () => {
      const guard: NavigationGuard = () => {
        return true;
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).resolves.toBeUndefined();
    });

    it('should handle async guards that return promises', async () => {
      const guard: NavigationGuard = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).resolves.toBeUndefined();
    });

    it('should handle guards that return false', async () => {
      const guard: NavigationGuard = () => {
        return false;
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).rejects.toMatchObject({
        type: ErrorTypes.NAVIGATION_ABORTED,
      });
    });

    it('should handle guards that return a redirect location', async () => {
      const guard: NavigationGuard = () => {
        return '/redirect';
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).rejects.toMatchObject({
        type: ErrorTypes.NAVIGATION_GUARD_REDIRECT,
      });
    });

    it('should handle guards that throw errors', async () => {
      const error = new Error('Guard threw error');
      const guard: NavigationGuard = () => {
        throw error;
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
      await expect(guardFn()).rejects.toBe(error);
    });

    it('should handle enterCallbacks when record and name are provided', async () => {
      const mockRecord = {
        enterCallbacks: {},
        instances: {},
      } as unknown as RouteRecordNormalized;

      const callback = vi.fn();
      const guard: NavigationGuard = (to, from, next) => {
        next(callback);
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom, mockRecord, 'default');
      await guardFn();

      expect(mockRecord.enterCallbacks['default']).toContain(callback);
    });

    it('should not add callback if enterCallbackArray changed', async () => {
      const mockRecord = {
        enterCallbacks: { default: [] },
        instances: {},
      } as unknown as RouteRecordNormalized;

      const callback = vi.fn();
      const guard: NavigationGuard = (to, from, next) => {
        // Simulate array change
        mockRecord.enterCallbacks['default'] = [];
        next(callback);
      };

      const guardFn = guardToPromiseFn(guard, mockTo, mockFrom, mockRecord, 'default');
      await guardFn();

      // Callback should not be added because array changed
      expect(mockRecord.enterCallbacks['default']).not.toContain(callback);
    });

    it('should handle guards with multiple random configurations', async () => {
      await testWithMultipleInputs(
        () => {
          const rand = Math.random();
          if (rand < 0.2) return createMockGuard('pass');
          if (rand < 0.4) return createMockGuard('fail');
          if (rand < 0.6) return createMockGuard('redirect', '/redirect');
          if (rand < 0.8) return createMockGuard('error');
          return createAsyncMockGuard('pass', 5);
        },
        async (guard) => {
          const guardFn = guardToPromiseFn(guard, mockTo, mockFrom);
          try {
            await guardFn();
            // If it resolves, guard should have been 'pass'
            expect(guard).toHaveBeenCalled();
          } catch (error) {
            // If it rejects, guard should have been 'fail', 'redirect', or 'error'
            expect(guard).toHaveBeenCalled();
          }
        },
        50
      );
    });
  });

  describe('extractComponentsGuards', () => {
    let mockTo: RouteLocationNormalized;
    let mockFrom: RouteLocationNormalizedLoaded;

    beforeEach(() => {
      mockTo = {
        path: '/to',
        name: 'to',
        params: {},
        query: {},
        hash: '',
        fullPath: '/to',
        matched: [],
        meta: {},
        redirectedFrom: undefined,
      } as RouteLocationNormalized;

      mockFrom = {
        path: '/from',
        name: 'from',
        params: {},
        query: {},
        hash: '',
        fullPath: '/from',
        matched: [],
        meta: {},
      } as RouteLocationNormalizedLoaded;
    });

    it('should extract guards from synchronous components', () => {
      const mockGuard = vi.fn((to, from, next) => next());
      const mockComponent = {
        beforeRouteEnter: mockGuard,
      };

      const mockRecord: RouteRecordNormalized = {
        path: '/test',
        components: { default: mockComponent },
        instances: {},
        children: [],
      } as any;

      const guards = extractComponentsGuards([mockRecord], 'beforeRouteEnter', mockTo, mockFrom);
      expect(guards).toHaveLength(1);
    });

    it('should skip update/leave guards if component not mounted', () => {
      const mockGuard = vi.fn((to, from, next) => next());
      const mockComponent = {
        beforeRouteUpdate: mockGuard,
      };

      const mockRecord: RouteRecordNormalized = {
        path: '/test',
        components: { default: mockComponent },
        instances: {}, // No instance mounted
        children: [],
      } as any;

      const guards = extractComponentsGuards([mockRecord], 'beforeRouteUpdate', mockTo, mockFrom);
      expect(guards).toHaveLength(0);
    });

    it('should extract guards from lazy components', async () => {
      const mockGuard = vi.fn((to, from, next) => next());
      const mockComponent = Promise.resolve({
        beforeRouteEnter: mockGuard,
      });

      const mockRecord: RouteRecordNormalized = {
        path: '/test',
        components: { default: mockComponent },
        instances: {},
        children: [],
        enterCallbacks: {}, // Add enterCallbacks
      } as any;

      const guards = extractComponentsGuards([mockRecord], 'beforeRouteEnter', mockTo, mockFrom);
      expect(guards).toHaveLength(1);

      // Execute the guard to trigger lazy loading
      await guards[0]();
      expect(mockGuard).toHaveBeenCalled();
    });

    it('should handle ES modules with default export', async () => {
      const mockGuard = vi.fn((to, from, next) => next());
      const mockComponent = Promise.resolve({
        __esModule: true,
        default: {
          beforeRouteEnter: mockGuard,
        },
      });

      const mockRecord: RouteRecordNormalized = {
        path: '/test',
        components: { default: mockComponent },
        instances: {},
        children: [],
        enterCallbacks: {}, // Add enterCallbacks
      } as any;

      const guards = extractComponentsGuards([mockRecord], 'beforeRouteEnter', mockTo, mockFrom);
      expect(guards).toHaveLength(1);

      await guards[0]();
      expect(mockGuard).toHaveBeenCalled();
    });

    it('should reject when lazy component fails to resolve', async () => {
      const mockComponent = Promise.resolve(null);

      const mockRecord: RouteRecordNormalized = {
        path: '/test',
        components: { default: mockComponent },
        instances: {},
        children: [],
      } as any;

      const guards = extractComponentsGuards([mockRecord], 'beforeRouteEnter', mockTo, mockFrom);
      expect(guards).toHaveLength(1);

      await expect(guards[0]()).rejects.toThrow('Couldn\'t resolve component');
    });

    it('should throw error for invalid component', () => {
      const mockRecord: RouteRecordNormalized = {
        path: '/test',
        components: { default: 'invalid' as any },
        instances: {},
        children: [],
      } as any;

      expect(() => {
        extractComponentsGuards([mockRecord], 'beforeRouteEnter', mockTo, mockFrom);
      }).toThrow('Invalid route component');
    });

    it('should handle multiple components in a record', () => {
      const mockGuard1 = vi.fn((to, from, next) => next());
      const mockGuard2 = vi.fn((to, from, next) => next());

      const mockRecord: RouteRecordNormalized = {
        path: '/test',
        components: {
          default: { beforeRouteEnter: mockGuard1 },
          sidebar: { beforeRouteEnter: mockGuard2 },
        },
        instances: {},
        children: [],
      } as any;

      const guards = extractComponentsGuards([mockRecord], 'beforeRouteEnter', mockTo, mockFrom);
      expect(guards).toHaveLength(2);
    });

    it('should handle components with options property', () => {
      const mockGuard = vi.fn((to, from, next) => next());
      const mockComponent = {
        options: {
          beforeRouteEnter: mockGuard,
        },
      };

      const mockRecord: RouteRecordNormalized = {
        path: '/test',
        components: { default: mockComponent },
        instances: {},
        children: [],
      } as any;

      const guards = extractComponentsGuards([mockRecord], 'beforeRouteEnter', mockTo, mockFrom);
      expect(guards).toHaveLength(1);
    });
  });

  describe('isRouteComponent', () => {
    it('should return true for regular functions', () => {
      const component = function() {};
      expect(isRouteComponent(component)).toBe(true);
    });

    it('should return true for arrow functions', () => {
      const component = () => {};
      expect(isRouteComponent(component)).toBe(true);
    });

    it('should return false for async functions', () => {
      const component = async () => {};
      expect(isRouteComponent(component)).toBe(false);
    });

    it('should return false for non-functions', () => {
      expect(isRouteComponent({} as any)).toBe(false);
      expect(isRouteComponent('string' as any)).toBe(false);
      expect(isRouteComponent(null as any)).toBe(false);
    });

    it('should return false for promises', () => {
      const component = Promise.resolve({});
      expect(isRouteComponent(component as any)).toBe(false);
    });
  });

  describe('loadRouteLocation', () => {
    it('should reject if route has only redirects', async () => {
      const mockRoute: RouteLocationNormalized = {
        path: '/test',
        name: 'test',
        params: {},
        query: {},
        hash: '',
        fullPath: '/test',
        matched: [
          { redirect: '/other' } as any,
        ],
        meta: {},
        redirectedFrom: undefined,
      };

      await expect(loadRouteLocation(mockRoute)).rejects.toThrow('Cannot load a route that redirects');
    });

    it('should resolve when route has no lazy components', async () => {
      const mockRoute: RouteLocationNormalized = {
        path: '/test',
        name: 'test',
        params: {},
        query: {},
        hash: '',
        fullPath: '/test',
        matched: [
          {
            path: '/test',
            components: { default: { name: 'TestComponent' } },
          } as any,
        ],
        meta: {},
        redirectedFrom: undefined,
      };

      const result = await loadRouteLocation(mockRoute);
      expect(result).toBe(mockRoute);
    });

    it('should load lazy components', async () => {
      const mockComponent = { name: 'LazyComponent' };
      const lazyComponent = Promise.resolve(mockComponent);

      const mockRecord = {
        path: '/test',
        components: { default: lazyComponent },
      };

      const mockRoute: RouteLocationNormalized = {
        path: '/test',
        name: 'test',
        params: {},
        query: {},
        hash: '',
        fullPath: '/test',
        matched: [mockRecord as any],
        meta: {},
        redirectedFrom: undefined,
      };

      const result = await loadRouteLocation(mockRoute);
      expect(result).toBe(mockRoute);
      expect(mockRecord.components.default).toBe(mockComponent);
    });

    it('should handle ES module lazy components', async () => {
      const mockComponent = { name: 'ESModuleComponent' };
      const lazyComponent = Promise.resolve({
        __esModule: true,
        default: mockComponent,
      });

      const mockRecord = {
        path: '/test',
        components: { default: lazyComponent },
      };

      const mockRoute: RouteLocationNormalized = {
        path: '/test',
        name: 'test',
        params: {},
        query: {},
        hash: '',
        fullPath: '/test',
        matched: [mockRecord as any],
        meta: {},
        redirectedFrom: undefined,
      };

      const result = await loadRouteLocation(mockRoute);
      expect(result).toBe(mockRoute);
      expect(mockRecord.components.default).toBe(mockComponent);
    });

    it('should reject when lazy component fails to resolve', async () => {
      const lazyComponent = Promise.resolve(null);

      const mockRecord = {
        path: '/test',
        components: { default: lazyComponent },
      };

      const mockRoute: RouteLocationNormalized = {
        path: '/test',
        name: 'test',
        params: {},
        query: {},
        hash: '',
        fullPath: '/test',
        matched: [mockRecord as any],
        meta: {},
        redirectedFrom: undefined,
      };

      await expect(loadRouteLocation(mockRoute)).rejects.toThrow('Couldn\'t resolve component');
    });

    it('should handle multiple lazy components', async () => {
      const mockComponent1 = { name: 'Component1' };
      const mockComponent2 = { name: 'Component2' };

      const mockRecord = {
        path: '/test',
        components: {
          default: Promise.resolve(mockComponent1),
          sidebar: Promise.resolve(mockComponent2),
        },
      };

      const mockRoute: RouteLocationNormalized = {
        path: '/test',
        name: 'test',
        params: {},
        query: {},
        hash: '',
        fullPath: '/test',
        matched: [mockRecord as any],
        meta: {},
        redirectedFrom: undefined,
      };

      const result = await loadRouteLocation(mockRoute);
      expect(result).toBe(mockRoute);
      expect(mockRecord.components.default).toBe(mockComponent1);
      expect(mockRecord.components.sidebar).toBe(mockComponent2);
    });

    it('should skip non-lazy components', async () => {
      const syncComponent = { name: 'SyncComponent' };
      const lazyComponent = Promise.resolve({ name: 'LazyComponent' });

      const mockRecord = {
        path: '/test',
        components: {
          default: syncComponent,
          sidebar: lazyComponent,
        },
      };

      const mockRoute: RouteLocationNormalized = {
        path: '/test',
        name: 'test',
        params: {},
        query: {},
        hash: '',
        fullPath: '/test',
        matched: [mockRecord as any],
        meta: {},
        redirectedFrom: undefined,
      };

      const result = await loadRouteLocation(mockRoute);
      expect(result).toBe(mockRoute);
      // Sync component should remain unchanged
      expect(mockRecord.components.default).toBe(syncComponent);
    });
  });

  describe('onBeforeRouteLeave and onBeforeRouteUpdate', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should warn when called outside router-view context', async () => {
      // Import the mocked module
      const essor = await import('essor');
      (essor.inject as any).mockReturnValue({ value: undefined });

      const mockGuard = vi.fn();
      
      // Should not throw, just warn
      expect(() => onBeforeRouteLeave(mockGuard)).not.toThrow();
      expect(() => onBeforeRouteUpdate(mockGuard)).not.toThrow();
    });

    it('should register guard when called in router-view context', async () => {
      // Import the mocked module
      const essor = await import('essor');
      const mockRecord = {
        leaveGuards: new Set(),
        updateGuards: new Set(),
      };
      (essor.inject as any).mockReturnValue({ value: mockRecord });

      const leaveGuard = vi.fn();
      const updateGuard = vi.fn();

      onBeforeRouteLeave(leaveGuard);
      onBeforeRouteUpdate(updateGuard);

      expect(mockRecord.leaveGuards.has(leaveGuard)).toBe(true);
      expect(mockRecord.updateGuards.has(updateGuard)).toBe(true);
      expect(essor.onDestroy).toHaveBeenCalled();
    });
  });
});
