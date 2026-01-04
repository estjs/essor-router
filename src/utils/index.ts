import type { RouteComponent, RouteParamValueRaw, RouteParams, RouteParamsRaw } from '../types';

export * from './env';

export function isESModule(obj: unknown): obj is { default: RouteComponent } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    ('__esModule' in obj || obj[Symbol.toStringTag] === 'Module')
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

/**
 * Reference to Object.prototype.toString
 * @type {Function}
 */
export const _toString = Object.prototype.toString;

export const isObject = (val: unknown): val is Record<any, unknown> =>
  val !== null && typeof val === 'object';

/**
 * Checks if a value is a Promise
 * @template T - The type of the Promise's resolved value
 * @param {unknown} val - The value to check
 * @returns {boolean} - Returns true if the value is a Promise, false otherwise
 */
export function isPromise<T = unknown>(val: unknown): val is Promise<T> {
  return _toString.call(val) === '[object Promise]';
}

/**
 * Checks if a value is an Array
 * @type {(arg: unknown ) => arg is unknown []}
 */
export const isArray = Array.isArray;

/**
 * Checks if a value is a string
 * @param {unknown} val - The value to check
 * @returns {boolean} - Returns true if the value is a string, false otherwise
 */
export function isString(val: unknown): val is string {
  return typeof val === 'string';
}

export function isAsyncFunction(fn: Function): boolean {
  return _toString.call(fn) === '[object AsyncFunction]';
}
/**
 * Checks if a value is a function
 * @param {unknown} val - The value to check
 * @returns {boolean} - Returns true if the value is a function, false otherwise
 */
export const isFunction = (val: unknown): val is Function => typeof val === 'function';
