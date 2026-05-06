import {
  isFunction as _isFunction,
  isObject as _isObject,
  isString as _isString,
  isSymbol as _isSymbol,
} from '@estjs/shared';
import type { RouteLocationRaw, RouteRecordName } from './index';

export function isRouteLocation(route: unknown): route is RouteLocationRaw {
  return _isString(route) || _isObject(route);
}

export function isRouteName(name: unknown): name is RouteRecordName {
  return _isString(name) || _isSymbol(name);
}

export const isString = _isString;
export const isObject = _isObject;
export const isFunction = _isFunction;
