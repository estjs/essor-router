import type { RouteLocationRaw, RouteRecordName } from './index';

// Enhanced type guard with better type safety
export function isRouteLocation(route: unknown): route is RouteLocationRaw {
  return typeof route === 'string' || (route !== null && typeof route === 'object');
}

// Enhanced type guard with better type safety
export function isRouteName(name: unknown): name is RouteRecordName {
  return typeof name === 'string' || typeof name === 'symbol';
}

// Additional type guards for better type safety
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}
