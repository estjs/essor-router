/**
 * Maybe a promise maybe not
 * @internal
 */
export type _Awaitable<T> = T | PromiseLike<T>;

/**
 * Creates a union type that still allows autocompletion for strings.
 *@internal
 */
export type LiteralStringUnion<LiteralType, BaseType extends string = string> =
  | LiteralType
  | (BaseType & Record<never, never>);

// for highlighting
export const ts = String.raw;

/**
 * Pads a single-line string with spaces.
 *
 * @internal
 *
 * @param spaces The number of spaces to pad with.
 * @param str The string to pad, none if omitted.
 * @returns The padded string.
 */
export function pad(spaces: number, str = ''): string {
  return ' '.repeat(spaces) + str;
}

/**
 * Formats an array of union items as a multiline union type.
 *
 * @internal
 *
 * @param items The items to format.
 * @param spaces The number of spaces to indent each line.
 * @returns The formatted multiline union type.
 */
export function formatMultilineUnion(items: string[], spaces: number): string {
  return (items.length ? items : ['never']).map((s) => `| ${s}`).join(`\n${pad(spaces)}`);
}

/**
 * Converts a string value to a string literal, escaping as necessary.
 *
 * @internal
 *
 * @param str the string to convert to a string type
 * @returns The string wrapped in single quotes and escaped.
 * @example
 * toStringLiteral('hello') // returns "'hello'"
 * toStringLiteral("it's fine") // returns "'it\'s fine'"
 */
export function toStringLiteral(str: string): string {
  // Escape every character that would otherwise terminate or corrupt a
  // single-quoted JS string literal. Backslash MUST be escaped first so the
  // escapes we introduce below are not themselves doubled. Newlines and the
  // Unicode line/paragraph separators (U+2028/U+2029) are illegal raw inside a
  // string literal, so they are escaped too. Without this, a path containing a
  // backslash (e.g. on Windows) or a newline could break out of the literal in
  // the generated source — a code-injection / broken-output hazard.
  const escaped = str
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll(/[\u2028\u2029]/g, (m) => (m === '\u2028' ? '\\u2028' : '\\u2029'));

  return `'${escaped}'`;
}
