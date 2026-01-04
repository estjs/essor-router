/**
 * Type Guards Tests
 * 
 * Comprehensive tests for type guard functions to ensure accurate type checking
 * across various input types and edge cases.
 * 
 * Target Coverage: 40% → 80%+
 */

import { describe, it, expect } from 'vitest';
import {
  isRouteLocation,
  isRouteName,
  isString,
  isObject,
  isFunction,
} from '../../src/types/typeGuards';
import { testWithMultipleInputs, randomString, randomInt, randomBoolean } from '../helpers/test-utils';

describe('typeGuards', () => {
  describe('isRouteLocation', () => {
    it('should return true for string paths', () => {
      expect(isRouteLocation('/')).toBe(true);
      expect(isRouteLocation('/home')).toBe(true);
      expect(isRouteLocation('/users/123')).toBe(true);
      expect(isRouteLocation('/path?query=value#hash')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isRouteLocation('')).toBe(true);
    });

    it('should return true for route location objects', () => {
      expect(isRouteLocation({ path: '/' })).toBe(true);
      expect(isRouteLocation({ name: 'home' })).toBe(true);
      expect(isRouteLocation({ path: '/users', query: { id: '1' } })).toBe(true);
      expect(isRouteLocation({ path: '/home', hash: '#section' })).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(isRouteLocation({})).toBe(true);
    });

    it('should return true for arrays (they are objects)', () => {
      expect(isRouteLocation([])).toBe(true);
      expect(isRouteLocation([1, 2, 3])).toBe(true);
    });

    it('should return false for null', () => {
      expect(isRouteLocation(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isRouteLocation(undefined)).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isRouteLocation(0)).toBe(false);
      expect(isRouteLocation(123)).toBe(false);
      expect(isRouteLocation(-456)).toBe(false);
      expect(isRouteLocation(NaN)).toBe(false);
      expect(isRouteLocation(Infinity)).toBe(false);
    });

    it('should return false for booleans', () => {
      expect(isRouteLocation(true)).toBe(false);
      expect(isRouteLocation(false)).toBe(false);
    });

    it('should return false for symbols', () => {
      expect(isRouteLocation(Symbol('test'))).toBe(false);
      expect(isRouteLocation(Symbol.for('test'))).toBe(false);
    });

    it('should return false for functions', () => {
      expect(isRouteLocation(() => {})).toBe(false);
      expect(isRouteLocation(function() {})).toBe(false);
      expect(isRouteLocation(async () => {})).toBe(false);
    });

    it('should handle complex objects', () => {
      expect(isRouteLocation({ nested: { deep: { object: true } } })).toBe(true);
      expect(isRouteLocation(new Date())).toBe(true);
      expect(isRouteLocation(new Map())).toBe(true);
      expect(isRouteLocation(new Set())).toBe(true);
    });

    it('should work with multiple random inputs', async () => {
      await testWithMultipleInputs(
        () => {
          const rand = Math.random();
          if (rand < 0.3) return randomString();
          if (rand < 0.6) return { path: randomString() };
          if (rand < 0.7) return null;
          if (rand < 0.8) return undefined;
          if (rand < 0.9) return randomInt(0, 1000);
          return randomBoolean();
        },
        (input) => {
          const result = isRouteLocation(input);
          // Verify the result matches expected behavior
          if (typeof input === 'string' || (input !== null && typeof input === 'object')) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        },
        100
      );
    });
  });

  describe('isRouteName', () => {
    it('should return true for string names', () => {
      expect(isRouteName('home')).toBe(true);
      expect(isRouteName('user-profile')).toBe(true);
      expect(isRouteName('about_us')).toBe(true);
      expect(isRouteName('route123')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isRouteName('')).toBe(true);
    });

    it('should return true for symbols', () => {
      expect(isRouteName(Symbol('route'))).toBe(true);
      expect(isRouteName(Symbol.for('route'))).toBe(true);
      expect(isRouteName(Symbol())).toBe(true);
    });

    it('should return false for null', () => {
      expect(isRouteName(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isRouteName(undefined)).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isRouteName(0)).toBe(false);
      expect(isRouteName(123)).toBe(false);
      expect(isRouteName(-456)).toBe(false);
      expect(isRouteName(NaN)).toBe(false);
    });

    it('should return false for booleans', () => {
      expect(isRouteName(true)).toBe(false);
      expect(isRouteName(false)).toBe(false);
    });

    it('should return false for objects', () => {
      expect(isRouteName({})).toBe(false);
      expect(isRouteName({ name: 'route' })).toBe(false);
      expect(isRouteName([])).toBe(false);
    });

    it('should return false for functions', () => {
      expect(isRouteName(() => {})).toBe(false);
      expect(isRouteName(function() {})).toBe(false);
    });

    it('should work with multiple random inputs', async () => {
      await testWithMultipleInputs(
        () => {
          const rand = Math.random();
          if (rand < 0.4) return randomString();
          if (rand < 0.5) return Symbol(randomString());
          if (rand < 0.6) return null;
          if (rand < 0.7) return undefined;
          if (rand < 0.8) return randomInt(0, 1000);
          if (rand < 0.9) return randomBoolean();
          return {};
        },
        (input) => {
          const result = isRouteName(input);
          // Verify the result matches expected behavior
          if (typeof input === 'string' || typeof input === 'symbol') {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        },
        100
      );
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('hello')).toBe(true);
      expect(isString('world')).toBe(true);
      expect(isString('123')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isString('')).toBe(true);
    });

    it('should return true for template literals', () => {
      const value = 'test';
      expect(isString(`hello ${value}`)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isString(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isString(undefined)).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isString(0)).toBe(false);
      expect(isString(123)).toBe(false);
      expect(isString(NaN)).toBe(false);
    });

    it('should return false for booleans', () => {
      expect(isString(true)).toBe(false);
      expect(isString(false)).toBe(false);
    });

    it('should return false for objects', () => {
      expect(isString({})).toBe(false);
      expect(isString({ value: 'string' })).toBe(false);
      expect(isString([])).toBe(false);
    });

    it('should return false for symbols', () => {
      expect(isString(Symbol('test'))).toBe(false);
    });

    it('should return false for functions', () => {
      expect(isString(() => {})).toBe(false);
    });

    it('should return false for String objects (not primitives)', () => {
      expect(isString(new String('test'))).toBe(false);
    });

    it('should work with multiple random inputs', async () => {
      await testWithMultipleInputs(
        () => {
          const rand = Math.random();
          if (rand < 0.5) return randomString();
          if (rand < 0.6) return randomInt(0, 1000);
          if (rand < 0.7) return randomBoolean();
          if (rand < 0.8) return null;
          if (rand < 0.9) return undefined;
          return {};
        },
        (input) => {
          const result = isString(input);
          expect(result).toBe(typeof input === 'string');
        },
        100
      );
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
      expect(isObject({ nested: { object: true } })).toBe(true);
    });

    it('should return true for arrays', () => {
      expect(isObject([])).toBe(true);
      expect(isObject([1, 2, 3])).toBe(true);
    });

    it('should return true for built-in objects', () => {
      expect(isObject(new Date())).toBe(true);
      expect(isObject(new Map())).toBe(true);
      expect(isObject(new Set())).toBe(true);
      expect(isObject(new WeakMap())).toBe(true);
      expect(isObject(new WeakSet())).toBe(true);
      expect(isObject(/regex/)).toBe(true);
    });

    it('should return false for functions (functions are not objects in this context)', () => {
      // Note: In JavaScript, functions are technically objects, but this type guard
      // specifically checks for typeof === 'object', which excludes functions
      expect(isObject(function() {})).toBe(false);
      expect(isObject(() => {})).toBe(false);
      expect(isObject(async () => {})).toBe(false);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isObject(undefined)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject('')).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isObject(0)).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(NaN)).toBe(false);
    });

    it('should return false for booleans', () => {
      expect(isObject(true)).toBe(false);
      expect(isObject(false)).toBe(false);
    });

    it('should return false for symbols', () => {
      expect(isObject(Symbol('test'))).toBe(false);
    });

    it('should work with multiple random inputs', async () => {
      await testWithMultipleInputs(
        () => {
          const rand = Math.random();
          if (rand < 0.3) return {};
          if (rand < 0.4) return [];
          if (rand < 0.5) return null;
          if (rand < 0.6) return undefined;
          if (rand < 0.7) return randomString();
          if (rand < 0.8) return randomInt(0, 1000);
          if (rand < 0.9) return randomBoolean();
          return () => {};
        },
        (input) => {
          const result = isObject(input);
          expect(result).toBe(input !== null && typeof input === 'object');
        },
        100
      );
    });
  });

  describe('isFunction', () => {
    it('should return true for regular functions', () => {
      expect(isFunction(function() {})).toBe(true);
      expect(isFunction(function named() {})).toBe(true);
    });

    it('should return true for arrow functions', () => {
      expect(isFunction(() => {})).toBe(true);
      expect(isFunction((x: number) => x * 2)).toBe(true);
    });

    it('should return true for async functions', () => {
      expect(isFunction(async function() {})).toBe(true);
      expect(isFunction(async () => {})).toBe(true);
    });

    it('should return true for generator functions', () => {
      expect(isFunction(function*() {})).toBe(true);
    });

    it('should return true for class constructors', () => {
      class TestClass {}
      expect(isFunction(TestClass)).toBe(true);
    });

    it('should return true for built-in functions', () => {
      expect(isFunction(Array)).toBe(true);
      expect(isFunction(Object)).toBe(true);
      expect(isFunction(Date)).toBe(true);
      expect(isFunction(Math.max)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isFunction(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isFunction(undefined)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isFunction('function')).toBe(false);
      expect(isFunction('')).toBe(false);
    });

    it('should return false for numbers', () => {
      expect(isFunction(0)).toBe(false);
      expect(isFunction(123)).toBe(false);
    });

    it('should return false for booleans', () => {
      expect(isFunction(true)).toBe(false);
      expect(isFunction(false)).toBe(false);
    });

    it('should return false for objects', () => {
      expect(isFunction({})).toBe(false);
      expect(isFunction({ func: () => {} })).toBe(false);
      expect(isFunction([])).toBe(false);
    });

    it('should return false for symbols', () => {
      expect(isFunction(Symbol('test'))).toBe(false);
    });

    it('should work with multiple random inputs', async () => {
      await testWithMultipleInputs(
        () => {
          const rand = Math.random();
          if (rand < 0.3) return () => {};
          if (rand < 0.4) return function() {};
          if (rand < 0.5) return null;
          if (rand < 0.6) return undefined;
          if (rand < 0.7) return randomString();
          if (rand < 0.8) return randomInt(0, 1000);
          if (rand < 0.9) return randomBoolean();
          return {};
        },
        (input) => {
          const result = isFunction(input);
          expect(result).toBe(typeof input === 'function');
        },
        100
      );
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle BigInt values', () => {
      expect(isString(BigInt(123))).toBe(false);
      expect(isObject(BigInt(123))).toBe(false);
      expect(isFunction(BigInt(123))).toBe(false);
      expect(isRouteLocation(BigInt(123))).toBe(false);
      expect(isRouteName(BigInt(123))).toBe(false);
    });

    it('should handle special number values', () => {
      expect(isString(Infinity)).toBe(false);
      expect(isString(-Infinity)).toBe(false);
      expect(isString(NaN)).toBe(false);
      
      expect(isObject(Infinity)).toBe(false);
      expect(isObject(-Infinity)).toBe(false);
      expect(isObject(NaN)).toBe(false);
    });

    it('should handle wrapped primitives', () => {
      expect(isString(new String('test'))).toBe(false);
      expect(isObject(new String('test'))).toBe(true);
      
      expect(isObject(new Number(123))).toBe(true);
      expect(isObject(new Boolean(true))).toBe(true);
    });

    it('should handle Proxy objects', () => {
      const target = { value: 'test' };
      const proxy = new Proxy(target, {});
      
      expect(isObject(proxy)).toBe(true);
      expect(isRouteLocation(proxy)).toBe(true);
    });

    it('should handle frozen and sealed objects', () => {
      const frozen = Object.freeze({ value: 'test' });
      const sealed = Object.seal({ value: 'test' });
      
      expect(isObject(frozen)).toBe(true);
      expect(isObject(sealed)).toBe(true);
      expect(isRouteLocation(frozen)).toBe(true);
      expect(isRouteLocation(sealed)).toBe(true);
    });
  });
});
