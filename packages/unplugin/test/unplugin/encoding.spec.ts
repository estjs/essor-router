import { describe, expect, it } from 'vitest';
import {
  decode,
  encodeHash,
  encodeParam,
  encodePath,
  encodeQueryKey,
  encodeQueryValue,
} from '../../src/utils/encoding';
import { mockWarn } from '../utils';

describe('encoding utils', () => {
  mockWarn();

  it('encodes query values and keys', () => {
    expect(encodeQueryValue('a b+c')).toBe('a+b%2Bc');
    expect(encodeQueryKey('a=b')).toBe('a%3Db');
  });

  it('encodes path/hash/param with reserved characters', () => {
    expect(encodePath('/foo?bar#baz')).toBe('/foo%3Fbar%23baz');
    expect(encodeParam('a/b')).toBe('a%2Fb');
    expect(encodeHash('{x}^')).toBe('{x}^');
  });

  it('returns original value and warns on invalid decode input', () => {
    expect(decode('%')).toBe('%');
    expect('Error decoding "%"').toHaveBeenWarned();
  });
});
