import { describe, expect, it } from 'vitest';
import { toStringLiteral } from '../../src/utils';

const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

/**
 * The literal produced by `toStringLiteral` is embedded verbatim into generated
 * source. It must always be a syntactically valid, single-quoted JS string
 * literal that parses back to the original value — otherwise a route/file/param
 * name containing a quote, backslash or newline could break the generated module
 * (a code-injection / broken-output hazard).
 */
describe('toStringLiteral', () => {
  const cases: Array<[name: string, input: string]> = [
    ['plain', 'hello'],
    ['single quote', "it's fine"],
    ['windows path (backslashes)', 'C:\\routes\\users'],
    ['trailing backslash', 'weird\\'],
    ['newline', 'line1\nline2'],
    ['carriage return', 'a\rb'],
    ['line separator U+2028', `a${LS}b`],
    ['paragraph separator U+2029', `a${PS}b`],
    ['injection attempt', "'); process.exit(1); ('"],
    ['mixed', "a'\\b\nc"],
  ];

  it.each(cases)('keeps output single-quoted and round-trips: %s', (_name, input) => {
    const literal = toStringLiteral(input);

    expect(literal.startsWith("'")).toBe(true);
    expect(literal.endsWith("'")).toBe(true);

    expect(eval(literal)).toBe(input);
  });

  it('does not change output for ordinary identifiers', () => {
    expect(toStringLiteral('users')).toBe("'users'");
    expect(toStringLiteral('/users/[id]')).toBe("'/users/[id]'");
  });
});
