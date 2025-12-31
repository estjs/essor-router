/**
 * Runtime type validation utilities for development mode
 * Provides helpful error messages for type mismatches
 */

import { warn } from './warning';
import type { RouteLocationRaw, RouteRecordName, RouteParams, LocationQuery } from './types';

// Environment check for development mode
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

/**
 * Validation error class for runtime type validation
 */
export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';
  readonly category = 'validation';
  readonly timestamp: number;
  readonly property: string;
  readonly expectedType: string;
  readonly actualType: string;
  readonly value: unknown;

  constructor(
    property: string,
    expectedType: string,
    actualType: string,
    value: unknown,
    message?: string
  ) {
    const defaultMessage = `Type validation failed for property '${property}': expected ${expectedType}, got ${actualType}`;
    super(message || defaultMessage);
    this.name = 'ValidationError';
    this.property = property;
    this.expectedType = expectedType;
    this.actualType = actualType;
    this.value = value;
    this.timestamp = Date.now();
  }
}

/**
 * Get the runtime type of a value
 */
function getType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Validate that a value is a string
 */
export function validateString(value: unknown, propertyName: string): asserts value is string {
  if (!isDev) return;
  
  if (typeof value !== 'string') {
    const actualType = getType(value);
    const error = new ValidationError(propertyName, 'string', actualType, value);
    warn(`${error.message}\nValue:`, value);
    throw error;
  }
}

/**
 * Validate that a value is a valid route name
 */
export function validateRouteName(value: unknown, propertyName: string): asserts value is RouteRecordName {
  if (!isDev) return;
  
  if (typeof value !== 'string' && typeof value !== 'symbol' && value !== null && value !== undefined) {
    const actualType = getType(value);
    const error = new ValidationError(propertyName, 'string | symbol | null | undefined', actualType, value);
    warn(`${error.message}\nValue:`, value);
    throw error;
  }
}

/**
 * Validate that a value is a valid route location
 */
export function validateRouteLocation(value: unknown, propertyName: string): asserts value is RouteLocationRaw {
  if (!isDev) return;
  
  if (typeof value !== 'string' && (typeof value !== 'object' || value === null)) {
    const actualType = getType(value);
    const error = new ValidationError(propertyName, 'string | object', actualType, value);
    warn(`${error.message}\nValue:`, value);
    throw error;
  }
  
  // Additional validation for object-based route locations
  if (typeof value === 'object' && value !== null) {
    const routeObj = value as Record<string, unknown>;
    
    // If it has a 'name' property, validate it
    if ('name' in routeObj && routeObj.name !== undefined) {
      validateRouteName(routeObj.name, `${propertyName}.name`);
    }
    
    // If it has a 'path' property, validate it
    if ('path' in routeObj && routeObj.path !== undefined) {
      validateString(routeObj.path, `${propertyName}.path`);
    }
    
    // If it has 'params', validate it's an object
    if ('params' in routeObj && routeObj.params !== undefined) {
      validateRouteParams(routeObj.params, `${propertyName}.params`);
    }
    
    // If it has 'query', validate it's an object
    if ('query' in routeObj && routeObj.query !== undefined) {
      validateLocationQuery(routeObj.query, `${propertyName}.query`);
    }
  }
}

/**
 * Validate route parameters object
 */
export function validateRouteParams(value: unknown, propertyName: string): asserts value is RouteParams {
  if (!isDev) return;
  
  if (typeof value !== 'object' || value === null) {
    const actualType = getType(value);
    const error = new ValidationError(propertyName, 'object', actualType, value);
    warn(`${error.message}\nValue:`, value);
    throw error;
  }
  
  // Validate each parameter value
  const params = value as Record<string, unknown>;
  for (const [key, paramValue] of Object.entries(params)) {
    if (paramValue !== undefined && paramValue !== null) {
      if (typeof paramValue !== 'string' && !Array.isArray(paramValue)) {
        const actualType = getType(paramValue);
        const error = new ValidationError(
          `${propertyName}.${key}`,
          'string | string[]',
          actualType,
          paramValue
        );
        warn(`${error.message}\nValue:`, paramValue);
        throw error;
      }
      
      // If it's an array, validate each element is a string
      if (Array.isArray(paramValue)) {
        paramValue.forEach((item, index) => {
          if (typeof item !== 'string') {
            const actualType = getType(item);
            const error = new ValidationError(
              `${propertyName}.${key}[${index}]`,
              'string',
              actualType,
              item
            );
            warn(`${error.message}\nValue:`, item);
            throw error;
          }
        });
      }
    }
  }
}

/**
 * Validate location query object
 */
export function validateLocationQuery(value: unknown, propertyName: string): asserts value is LocationQuery {
  if (!isDev) return;
  
  if (typeof value !== 'object' || value === null) {
    const actualType = getType(value);
    const error = new ValidationError(propertyName, 'object', actualType, value);
    warn(`${error.message}\nValue:`, value);
    throw error;
  }
  
  // Validate each query parameter value
  const query = value as Record<string, unknown>;
  for (const [key, queryValue] of Object.entries(query)) {
    if (queryValue !== undefined && queryValue !== null) {
      if (typeof queryValue !== 'string' && !Array.isArray(queryValue)) {
        const actualType = getType(queryValue);
        const error = new ValidationError(
          `${propertyName}.${key}`,
          'string | string[]',
          actualType,
          queryValue
        );
        warn(`${error.message}\nValue:`, queryValue);
        throw error;
      }
      
      // If it's an array, validate each element is a string
      if (Array.isArray(queryValue)) {
        queryValue.forEach((item, index) => {
          if (typeof item !== 'string') {
            const actualType = getType(item);
            const error = new ValidationError(
              `${propertyName}.${key}[${index}]`,
              'string',
              actualType,
              item
            );
            warn(`${error.message}\nValue:`, item);
            throw error;
          }
        });
      }
    }
  }
}

/**
 * Validate that a value is a boolean
 */
export function validateBoolean(value: unknown, propertyName: string): asserts value is boolean {
  if (!isDev) return;
  
  if (typeof value !== 'boolean' && value !== undefined) {
    const actualType = getType(value);
    const error = new ValidationError(propertyName, 'boolean | undefined', actualType, value);
    warn(`${error.message}\nValue:`, value);
    throw error;
  }
}

/**
 * Validate that a value is a function
 */
export function validateFunction(value: unknown, propertyName: string): asserts value is Function {
  if (!isDev) return;
  
  if (typeof value !== 'function' && value !== undefined) {
    const actualType = getType(value);
    const error = new ValidationError(propertyName, 'function | undefined', actualType, value);
    warn(`${error.message}\nValue:`, value);
    throw error;
  }
}

/**
 * Validate RouterView props at runtime
 */
export function validateRouterViewProps(props: Record<string, unknown>): void {
  if (!isDev) return;
  
  try {
    if ('name' in props && props.name !== undefined) {
      validateString(props.name, 'RouterView.name');
    }
    
    if ('route' in props && props.route !== undefined) {
      // Basic validation for route object structure
      if (typeof props.route !== 'object' || props.route === null) {
        const actualType = getType(props.route);
        const error = new ValidationError('RouterView.route', 'RouteLocationNormalized', actualType, props.route);
        warn(`${error.message}\nValue:`, props.route);
        throw error;
      }
    }
    
    if ('onError' in props && props.onError !== undefined) {
      validateFunction(props.onError, 'RouterView.onError');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      warn(`RouterView prop validation failed: ${error.message}`);
      warn('Consider checking your RouterView props for type correctness.');
    }
    throw error;
  }
}

/**
 * Validate RouterLink props at runtime
 */
export function validateRouterLinkProps(props: Record<string, unknown>): void {
  if (!isDev) return;
  
  try {
    if ('to' in props && props.to !== undefined) {
      validateRouteLocation(props.to, 'RouterLink.to');
    }
    
    if ('replace' in props && props.replace !== undefined) {
      validateBoolean(props.replace, 'RouterLink.replace');
    }
    
    if ('custom' in props && props.custom !== undefined) {
      validateBoolean(props.custom, 'RouterLink.custom');
    }
    
    if ('activeClass' in props && props.activeClass !== undefined) {
      validateString(props.activeClass, 'RouterLink.activeClass');
    }
    
    if ('exactActiveClass' in props && props.exactActiveClass !== undefined) {
      validateString(props.exactActiveClass, 'RouterLink.exactActiveClass');
    }
    
    if ('ariaCurrentValue' in props && props.ariaCurrentValue !== undefined) {
      const validValues = ['page', 'step', 'location', 'date', 'time', 'true', 'false'];
      if (typeof props.ariaCurrentValue !== 'string' || !validValues.includes(props.ariaCurrentValue)) {
        const error = new ValidationError(
          'RouterLink.ariaCurrentValue',
          validValues.join(' | '),
          getType(props.ariaCurrentValue),
          props.ariaCurrentValue
        );
        warn(`${error.message}\nValue:`, props.ariaCurrentValue);
        throw error;
      }
    }
    
    if ('viewTransition' in props && props.viewTransition !== undefined) {
      validateBoolean(props.viewTransition, 'RouterLink.viewTransition');
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      warn(`RouterLink prop validation failed: ${error.message}`);
      warn('Consider checking your RouterLink props for type correctness.');
    }
    throw error;
  }
}

/**
 * Validate navigation guard function signature
 */
export function validateNavigationGuard(guard: unknown, guardName: string): void {
  if (!isDev) return;
  
  if (typeof guard !== 'function') {
    const actualType = getType(guard);
    const error = new ValidationError(guardName, 'function', actualType, guard);
    warn(`${error.message}\nValue:`, guard);
    throw error;
  }
  
  // Check function arity (parameter count)
  const func = guard as Function;
  if (func.length < 2 || func.length > 3) {
    warn(
      `Navigation guard '${guardName}' has ${func.length} parameters, but should have 2-3 parameters: (to, from, next?)`
    );
    warn('Guard function:', func.toString());
  }
}

/**
 * Create a development-mode wrapper that validates props
 */
export function withPropValidation<T>(
  componentName: string,
  validator: (props: Record<string, unknown>) => void
) {
  return (originalComponent: (props: T) => unknown) => {
    return (props: T) => {
      if (isDev) {
        try {
          validator(props as unknown as Record<string, unknown>);
        } catch (error) {
          warn(`${componentName} validation failed:`, error);
          // In development, we still render the component but with warnings
        }
      }
      return originalComponent(props);
    };
  };
}