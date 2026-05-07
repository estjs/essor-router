import { warn } from './warning';

/**
 * Encoding Rules (␣ = Space)
 * - Path: ␣ " < > # ? { }
 * - Query: ␣ " < > # & =
 * - Hash: ␣ " < > `
 *
 * On top of that, the RFC3986 (https://tools.ietf.org/html/rfc3986#section-2.2)
 * defines some extra characters to be encoded. Most browsers do not encode them
 * in encodeURI https://github.com/whatwg/url/issues/369, so it may be safer to
 * also encode `!'()*`. Leaving un-encoded only ASCII alphanumeric(`a-zA-Z0-9`)
 * plus `-._~`. This extra safety should be applied to query by patching the
 * string returned by encodeURIComponent encodeURI also encodes `[\]^`. `\`
 * should be encoded to avoid ambiguity. Browsers (IE, FF, C) transform a `\`
 * into a `/` if directly typed in. The _backtick_ (`````) should also be
 * encoded everywhere because some browsers like FF encode it when directly
 * written while others don't. Safari and IE don't encode ``"<>{}``` in hash.
 */

export const PLUS_RE = /\+/g; // %2B

// Combined regexes: replace multiple chained replaceAll calls with a single
// regex + replacer callback to reduce intermediate string allocations.

const ENC_HASH_RE = /%(?:5B|5D|5E|7B|7C|7D)/g;

function encHashReplacer(m: string): string {
  switch (m) {
    case '%5B':
      return '[';
    case '%5D':
      return ']';
    case '%5E':
      return '^';
    case '%7B':
      return '{';
    case '%7C':
      return '|';
    case '%7D':
      return '}';
    default:
      return m;
  }
}

const ENC_QUERY_RE = /%(?:5B|5D|5E|60|7B|7C|7D|20)|[+#&]/g;

const ENC_QUERY_TABLE: Record<string, string> = {
  '%5B': '[',
  '%5D': ']',
  '%5E': '^',
  '%60': '`',
  '%7B': '{',
  '%7C': '|',
  '%7D': '}',
  '%20': '+',
  '+': '%2B',
  '#': '%23',
  '&': '%26',
};

const ENC_QUERY_KEY_RE = /%(?:5B|5D|5E|60|7B|7C|7D|20)|[+#&=]/g;

const ENC_QUERY_KEY_TABLE: Record<string, string> = {
  ...ENC_QUERY_TABLE,
  '=': '%3D',
};

const ENC_PATH_RE = /%(?:5B|5D|7C)|[#?]/g;

function encPathReplacer(m: string): string {
  switch (m) {
    case '%5B':
      return '[';
    case '%5D':
      return ']';
    case '%7C':
      return '|';
    case '#':
      return '%23';
    case '?':
      return '%3F';
    default:
      return m;
  }
}

const ENC_PARAM_RE = /%(?:5B|5D|7C)|[#?/]/g;

function encParamReplacer(m: string): string {
  switch (m) {
    case '%5B':
      return '[';
    case '%5D':
      return ']';
    case '%7C':
      return '|';
    case '#':
      return '%23';
    case '?':
      return '%3F';
    case '/':
      return '%2F';
    default:
      return m;
  }
}

/**
 * Encode characters that need to be encoded on the hash section of the URL.
 *
 * @param text - string to encode
 * @returns encoded string
 */
export function encodeHash(text: string): string {
  return encodeURI(`${text}`).replaceAll(ENC_HASH_RE, encHashReplacer);
}

/**
 * Encode characters that need to be encoded query values on the query
 * section of the URL.
 *
 * @param text - string to encode
 * @returns encoded string
 */
export function encodeQueryValue(text: string | number): string {
  return encodeURI(`${text}`).replaceAll(ENC_QUERY_RE, (m) => ENC_QUERY_TABLE[m] ?? m);
}

/**
 * Like `encodeQueryValue` but also encodes the `=` character.
 *
 * @param text - string to encode
 */
export function encodeQueryKey(text: string | number): string {
  return encodeURI(`${text}`).replaceAll(ENC_QUERY_KEY_RE, (m) => ENC_QUERY_KEY_TABLE[m] ?? m);
}

/**
 * Encode characters that need to be encoded on the path section of the URL.
 *
 * @param text - string to encode
 * @returns encoded string
 */
export function encodePath(text: string | number): string {
  return encodeURI(`${text}`).replaceAll(ENC_PATH_RE, encPathReplacer);
}

/**
 * Encode characters that need to be encoded on the path section of the URL as a
 * param. This function encodes everything {@link encodePath} does plus the
 * slash (`/`) character. If `text` is `null` or `undefined`, returns an empty
 * string instead.
 *
 * @param text - string to encode
 * @returns encoded string
 */
export function encodeParam(text: string | number | null | undefined): string {
  return text == null ? '' : encodeURI(`${text}`).replaceAll(ENC_PARAM_RE, encParamReplacer);
}

/**
 * Decode text using `decodeURIComponent`. Returns the original text if it
 * fails.
 *
 * @param text - string to decode
 * @returns decoded string
 */
export function decode(text: string | number): string {
  try {
    return decodeURIComponent(`${text}`);
  } catch {
    __DEV__ && warn(`Error decoding "${text}". Using original value`);
  }
  return `${text}`;
}
