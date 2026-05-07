import { PLUS_RE, decode, encodeQueryKey, encodeQueryValue } from './encoding';
import { isArray } from './utils';

/**
 * Possible values in normalized {@link LocationQuery}. `null` renders the query
 * param but without an `=`.
 *
 * @example
 * ```
 * ?isNull&isEmpty=&other=other
 * gives
 * `{ isNull: null, isEmpty: '', other: 'other' }`.
 * ```
 *

 */
export type LocationQueryValue = string | null;
/**
 * Possible values when defining a query.
 *

 */
export type LocationQueryValueRaw = LocationQueryValue | number | undefined;
/**
 * Normalized query object that appears in {@link RouteLocationNormalized}
 *
 * @public
 */
export type LocationQuery = Record<string, LocationQueryValue | LocationQueryValue[]>;
/**
 * Loose {@link LocationQuery} object that can be passed to functions like
 * {@link Router.push} and {@link Router.replace} or anywhere when creating a
 * {@link RouteLocationRaw}
 *
 * @public
 */
export type LocationQueryRaw = Record<
  string | number,
  LocationQueryValueRaw | LocationQueryValueRaw[]
>;

/**
 * Transforms a queryString into a {@link LocationQuery} object. Accept both, a
 * version with the leading `?` and without Should work as URLSearchParams


 *
 * @param search - search string to parse
 * @returns a query object
 */
export function parseQuery(search: string): LocationQuery {
  const query: LocationQuery = {};
  // avoid creating an object with an empty key and empty value
  // because of split('&')
  if (search === '' || search === '?') return query;
  const hasLeadingIM = search[0] === '?';
  const searchParams = (hasLeadingIM ? search.slice(1) : search).split('&');
  for (const searchParam_ of searchParams) {
    // pre decode the + into space
    const searchParam = searchParam_.replace(PLUS_RE, ' ');
    // allow the = character
    const eqPos = searchParam.indexOf('=');
    const key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
    const value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1));

    if (key in query) {
      // an extra variable for ts types
      let currentValue = query[key];
      if (!isArray(currentValue)) {
        currentValue = query[key] = [currentValue];
      }
      // we force the modification
      (currentValue as LocationQueryValue[]).push(value);
    } else {
      query[key] = value;
    }
  }
  return query;
}

/**
 * Stringifies a {@link LocationQueryRaw} object. Like `URLSearchParams`, it
 * doesn't prepend a `?`
 *

 *
 * @param query - query object to stringify
 * @returns string version of the query without the leading `?`
 */
export function stringifyQuery(query: LocationQueryRaw): string {
  const parts: string[] = [];
  for (const key of Object.keys(query)) {
    const value = query[key];
    const encodedKey = encodeQueryKey(key);
    if (value == null) {
      if (value !== undefined) {
        parts.push(encodedKey);
      }
      continue;
    }
    const values: LocationQueryValueRaw[] = isArray(value)
      ? value.map((v) => v && encodeQueryValue(v))
      : [value && encodeQueryValue(value)];

    for (const v of values) {
      if (v !== undefined) {
        if (v != null) {
          parts.push(`${encodedKey}=${v}`);
        } else {
          parts.push(encodedKey);
        }
      }
    }
  }
  return parts.join('&');
}

/**
 * Transforms a {@link LocationQueryRaw} into a {@link LocationQuery} by casting
 * numbers into strings, removing keys with an undefined value and replacing
 * undefined with null in arrays
 *
 * @param query - query object to normalize
 * @returns a normalized query object
 */
export function normalizeQuery(query: LocationQueryRaw | undefined): LocationQuery {
  const normalizedQuery: LocationQuery = {};
  if (!query) return normalizedQuery;

  for (const key of Object.keys(query)) {
    const value = query[key];
    if (value !== undefined) {
      normalizedQuery[key] = isArray(value)
        ? value.map((v) => (v == null ? null : `${v}`))
        : value == null
          ? value
          : `${value}`;
    }
  }

  return normalizedQuery;
}
