// Minimal URL-path encoding used by the unplugin codegen. The router package
// owns the full encoding surface (query/hash/param/decode); only path encoding
// is needed here, so only that is kept.

const HASH_RE = /#/g; // %23
const IM_RE = /\?/g; // %3F
const ENC_BRACKET_OPEN_RE = /%5B/g; // [
const ENC_BRACKET_CLOSE_RE = /%5D/g; // ]
const ENC_PIPE_RE = /%7C/g; // |

/**
 * Encode characters that need to be encoded on the path, search and hash
 * sections of the URL.
 *
 * @internal
 * @param text - string to encode
 * @returns encoded string
 */
export function commonEncode(text: string | number | null | undefined): string {
  return text == null
    ? ''
    : encodeURI(`${text}`)
        .replaceAll(ENC_PIPE_RE, '|')
        .replaceAll(ENC_BRACKET_OPEN_RE, '[')
        .replaceAll(ENC_BRACKET_CLOSE_RE, ']');
}

/**
 * Encode characters that need to be encoded on the path section of the URL.
 *
 * @param text - string to encode
 * @returns encoded string
 */
export function encodePath(text: string | number | null | undefined): string {
  return commonEncode(text).replaceAll(HASH_RE, '%23').replaceAll(IM_RE, '%3F');
}
