import { isArray, isFunction, isObject } from '@estjs/shared';
import type { RouteComponent, RouteParamValueRaw, RouteParams, RouteParamsRaw } from '../types';

export * from './env';

export function isESModule(obj: unknown): obj is { default: RouteComponent } {
  return (
    obj !== null &&
    isObject(obj) &&
    ('__esModule' in obj || (obj as any)[Symbol.toStringTag] === 'Module')
  );
}

export const assign = Object.assign;

export function applyToParams(
  fn: (v: string | number | null | undefined) => string,
  params: RouteParamsRaw | undefined,
): RouteParams {
  const newParams: RouteParams = {};

  for (const key in params) {
    const value = params[key];
    newParams[key] = isArray(value)
      ? value.map(fn)
      : fn(value as Exclude<RouteParamValueRaw, any[]>);
  }

  return newParams;
}

export const noop = () => {};

export { isArray, isObject, isString, isFunction } from '@estjs/shared';

export function isAsyncFunction(fn: Function): boolean {
  return Object.prototype.toString.call(fn) === '[object AsyncFunction]';
}

/**
 * Checks if a value is a Promise-like object (thenable).
 */
export function isPromiseLike(value: unknown): value is Promise<unknown> {
  return !!value && (isObject(value) || isFunction(value)) && isFunction((value as any).then);
}

/**
 * Normalizes an unknown error value into an Error instance.
 */
export function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
