import { isString } from '@estjs/shared';
import { createRouteAccessor } from '../core/useApi';
import { decode, encodeHash, encodeParam } from '../encoding';
import { parseURL, stringifyURL } from '../core/location';
import {
  type LocationQuery,
  type parseQuery as defaultParseQuery,
  stringifyQuery as defaultStringifyQuery,
  normalizeQuery,
} from '../core/query';
import {
  type MatcherLocationRaw,
  type RouteLocation,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
  type RouteLocationRaw,
  type RouteParams,
  isRouteLocation,
} from '../types';
import { applyToParams, assign } from '../utils';
import { warn } from '../core/warning';
import type { Signal } from 'essor';
import type { RouterHistory } from '../history/common';
import type { RouterMatcher } from '../matcher';

export interface RouteResolver {
  resolve: (
    rawLocation: Readonly<RouteLocationRaw>,
    currentLocation?: RouteLocationNormalizedLoaded,
  ) => RouteLocation & { href: string };
  locationAsObject: (
    to: RouteLocationRaw | RouteLocationNormalized,
  ) => Exclude<RouteLocationRaw, string> | RouteLocationNormalized;
}

export function createReactiveRoute(
  currentRoute: Signal<RouteLocationNormalizedLoaded>,
): RouteLocationNormalizedLoaded {
  return createRouteAccessor(currentRoute);
}

export function createRouteResolver(
  matcher: RouterMatcher,
  routerHistory: RouterHistory,
  parseQuery: typeof defaultParseQuery,
  stringifyQuery: typeof defaultStringifyQuery,
  getCurrentRoute: () => RouteLocationNormalizedLoaded,
): RouteResolver {
  const normalizeParams = applyToParams.bind(null, (paramValue) => `${paramValue}`);
  const encodeParams = applyToParams.bind(null, encodeParam);
  const decodeParams: (params: RouteParams | undefined) => RouteParams =
    // @ts-expect-error intentional runtime conversion
    applyToParams.bind(null, decode);

  function resolve(
    rawLocation: Readonly<RouteLocationRaw>,
    currentLocation?: RouteLocationNormalizedLoaded,
  ): RouteLocation & { href: string } {
    currentLocation = assign({}, currentLocation || getCurrentRoute());

    if (isString(rawLocation)) {
      const locationNormalized = parseURL(parseQuery, rawLocation, currentLocation.path);
      const matchedRoute = matcher.resolve({ path: locationNormalized.path }, currentLocation);
      const href = routerHistory.createHref(locationNormalized.fullPath);

      if (__DEV__) {
        if (href.startsWith('//')) {
          warn(
            `Location "${rawLocation}" resolved to "${href}".A resolved location cannot start with multiple slashes.`,
          );
        } else if (matchedRoute.matched.length === 0) {
          warn(`No match found for location with path "${rawLocation}"`);
        }
      }

      return assign(locationNormalized, matchedRoute, {
        params: decodeParams(matchedRoute.params),
        hash: decode(locationNormalized.hash),
        redirectedFrom: undefined,
        href,
      });
    }

    if (__DEV__ && !isRouteLocation(rawLocation)) {
      warn(
        'router.resolve() was passed an invalid location.This will fail in production.\n - Location: ',
        rawLocation,
      );
      rawLocation = {};
    }

    let matcherLocation: MatcherLocationRaw;
    if (rawLocation.path != null) {
      if (
        __DEV__ &&
        'params' in rawLocation &&
        !('name' in rawLocation) &&
        // @ts-expect-error branch relies on runtime object input
        Object.keys(rawLocation.params).length > 0
      ) {
        warn(
          `Path "${rawLocation.path}" was passed with params but they will be ignored.Use a named route alongside params instead.`,
        );
      }
      matcherLocation = assign({}, rawLocation, {
        path: parseURL(parseQuery, rawLocation.path, currentLocation.path).path,
      });
    } else {
      const targetParams = assign({}, rawLocation.params);
      for (const key in targetParams) {
        if (targetParams[key] == null) {
          delete targetParams[key];
        }
      }
      matcherLocation = assign({}, rawLocation, {
        params: encodeParams(targetParams),
      });
      currentLocation.params = encodeParams(currentLocation.params);
    }

    const matchedRoute = matcher.resolve(matcherLocation, currentLocation);
    const hash = rawLocation.hash || '';

    if (__DEV__ && hash && !hash.startsWith('#')) {
      warn(
        `A \`hash\` should always start with the character "#". Replace "${hash}" with "#${hash}".`,
      );
    }

    matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
    const fullPath = stringifyURL(
      stringifyQuery,
      assign({}, rawLocation, {
        hash: encodeHash(hash),
        path: matchedRoute.path,
      }),
    );

    const href = routerHistory.createHref(fullPath);

    if (__DEV__) {
      if (href.startsWith('//')) {
        warn(
          `Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`,
        );
      } else if (matchedRoute.matched.length === 0) {
        warn(
          `No match found for location with path "${rawLocation.path != null ? rawLocation.path : rawLocation}"`,
        );
      }
    }

    return assign(
      {
        fullPath,
        hash,
        query:
          stringifyQuery === defaultStringifyQuery
            ? normalizeQuery(rawLocation.query)
            : ((rawLocation.query || {}) as LocationQuery),
      },
      matchedRoute,
      {
        redirectedFrom: undefined,
        href,
      },
    );
  }

  function locationAsObject(
    to: RouteLocationRaw | RouteLocationNormalized,
  ): Exclude<RouteLocationRaw, string> | RouteLocationNormalized {
    return isString(to) ? parseURL(parseQuery, to, getCurrentRoute().path) : assign({}, to);
  }

  return {
    resolve,
    locationAsObject,
  };
}
