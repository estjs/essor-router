import { describe, expect, it } from 'vitest';
import { encodePath } from '../../src/utils/encoding';

describe('encoding utils', () => {
  it('encodes path reserved characters', () => {
    expect(encodePath('/foo?bar#baz')).toBe('/foo%3Fbar%23baz');
  });

  it('encodes null/undefined as an empty string', () => {
    expect(encodePath(null)).toBe('');
    expect(encodePath(undefined)).toBe('');
  });
});
