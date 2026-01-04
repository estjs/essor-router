/**
 * Test Utilities and Helpers
 * 
 * This module provides utility functions for creating test scenarios,
 * generating test data, and common test patterns using Vitest.
 */

import type {
  RouteLocationRaw,
  RouteRecordRaw,
  RouteParams,
  LocationQuery,
  NavigationGuard,
} from '../../src/types';
import type { Router } from '../../src/router';
import { createRouter, createMemoryHistory } from '../../src';

/**
 * Generate random route parameters for testing
 */
export function generateRouteParams(count: number = 3): RouteParams {
  const params: RouteParams = {};
  for (let i = 0; i < count; i++) {
    const key = `param${i}`;
    params[key] = Math.random() > 0.5 
      ? `value${Math.floor(Math.random() * 100)}`
      : [`val${i}`, `val${i + 1}`];
  }
  return params;
}

/**
 * Generate random query parameters for testing
 */
export function generateLocationQuery(count: number = 3): LocationQuery {
  const query: LocationQuery = {};
  for (let i = 0; i < count; i++) {
    const key = `query${i}`;
    const rand = Math.random();
    if (rand > 0.66) {
      query[key] = `value${Math.floor(Math.random() * 100)}`;
    } else if (rand > 0.33) {
      query[key] = [`val${i}`, `val${i + 1}`];
    } else {
      query[key] = null;
    }
  }
  return query;
}

/**
 * Generate random route paths for testing
 */
export function generateRoutePath(segments: number = 3): string {
  if (segments === 0) return '/';
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    parts.push(`segment${i}`);
  }
  return `/${parts.join('/')}`;
}

/**
 * Generate random route location (string or object)
 */
export function generateRouteLocation(asObject: boolean = false): RouteLocationRaw {
  if (!asObject && Math.random() > 0.5) {
    const path = generateRoutePath(Math.floor(Math.random() * 4));
    const query = Math.random() > 0.5 ? '?foo=bar' : '';
    const hash = Math.random() > 0.5 ? '#section' : '';
    return `${path}${query}${hash}`;
  }
  
  return {
    path: generateRoutePath(Math.floor(Math.random() * 4)),
    query: Math.random() > 0.5 ? generateLocationQuery(2) : undefined,
    hash: Math.random() > 0.5 ? `#hash${Math.floor(Math.random() * 10)}` : undefined,
  };
}

/**
 * Create a test router with predefined routes
 */
export function createTestRouter(routes?: RouteRecordRaw[]): Router {
  const defaultRoutes: RouteRecordRaw[] = routes || [
    { path: '/', name: 'home', component: { name: 'Home' } },
    { path: '/about', name: 'about', component: { name: 'About' } },
    { path: '/users/:id', name: 'user', component: { name: 'User' } },
    { path: '/posts/:id?', name: 'post', component: { name: 'Post' } },
  ];

  return createRouter({
    history: createMemoryHistory(),
    routes: defaultRoutes,
  });
}

/**
 * Create a mock navigation guard for testing
 */
export function createMockGuard(
  behavior: 'pass' | 'fail' | 'redirect' | 'error' = 'pass',
  redirectTo?: RouteLocationRaw,
): NavigationGuard {
  return vitest.fn((to, from, next) => {
    switch (behavior) {
      case 'pass':
        next();
        break;
      case 'fail':
        next(false);
        break;
      case 'redirect':
        next(redirectTo || '/');
        break;
      case 'error':
        next(new Error('Guard error'));
        break;
    }
  });
}

/**
 * Create an async mock guard for testing
 */
export function createAsyncMockGuard(
  behavior: 'pass' | 'fail' | 'redirect' | 'error' = 'pass',
  delay: number = 10,
  redirectTo?: RouteLocationRaw,
): NavigationGuard {
  return vitest.fn(async (to, from, next) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    switch (behavior) {
      case 'pass':
        next();
        break;
      case 'fail':
        next(false);
        break;
      case 'redirect':
        next(redirectTo || '/');
        break;
      case 'error':
        next(new Error('Async guard error'));
        break;
    }
  });
}

/**
 * Wait for router to be ready
 */
export async function waitForRouter(router: Router, timeout: number = 1000): Promise<void> {
  const start = Date.now();
  while (!router.currentRoute.value.matched.length && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Generate test data for multiple iterations
 * Useful for testing with various inputs
 */
export function generateTestCases<T>(
  generator: () => T,
  count: number = 10,
): T[] {
  const cases: T[] = [];
  for (let i = 0; i < count; i++) {
    cases.push(generator());
  }
  return cases;
}

/**
 * Test a function with multiple random inputs
 * Simulates property-based testing behavior
 */
export async function testWithMultipleInputs<T>(
  generator: () => T,
  testFn: (input: T) => void | Promise<void>,
  iterations: number = 100,
): Promise<void> {
  for (let i = 0; i < iterations; i++) {
    const input = generator();
    try {
      await testFn(input);
    } catch (error) {
      // Add context to the error
      const enhancedError = new Error(
        `Test failed on iteration ${i + 1}/${iterations}\n` +
        `Input: ${JSON.stringify(input, null, 2)}\n` +
        `Original error: ${error instanceof Error ? error.message : String(error)}`
      );
      enhancedError.stack = error instanceof Error ? error.stack : undefined;
      throw enhancedError;
    }
  }
}

/**
 * Assert that a value matches one of several possible values
 */
export function assertOneOf<T>(actual: T, expected: T[], message?: string): void {
  if (!expected.includes(actual)) {
    throw new Error(
      message || 
      `Expected value to be one of ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Generate random boolean
 */
export function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

/**
 * Generate random integer in range
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Pick random element from array
 */
export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
