import { stringifyQuery } from '../src/core/query';
import { mockWarn } from './utils';

describe('stringifyQuery', () => {
  mockWarn();

  it('stringifies multiple values', () => {
    expect(stringifyQuery({ e: 'a', b: 'c' })).toEqual('e=a&b=c');
  });

  it('stringifies null values', () => {
    expect(stringifyQuery({ e: null })).toEqual('e');
    expect(stringifyQuery({ e: null, b: null })).toEqual('e&b');
  });

  it('stringifies null values in arrays', () => {
    expect(stringifyQuery({ e: [null] })).toEqual('e');
    expect(stringifyQuery({ e: [null, 'c'] })).toEqual('e&e=c');
  });

  it('stringifies numbers', () => {
    expect(stringifyQuery({ e: 2 })).toEqual('e=2');
    expect(stringifyQuery({ e: [2, 'b'] })).toEqual('e=2&e=b');
  });

  it('ignores undefined values', () => {
    expect(stringifyQuery({ e: undefined })).toEqual('');
    expect(stringifyQuery({ e: undefined, b: 'a' })).toEqual('b=a');
  });

  it('avoids trailing &', () => {
    expect(stringifyQuery({ a: 'a', b: undefined })).toEqual('a=a');
    expect(stringifyQuery({ a: 'a', c: [] })).toEqual('a=a');
  });

  it('skips undefined in arrays', () => {
    expect(stringifyQuery({ a: [undefined, '3'] })).toEqual('a=3');
    expect(stringifyQuery({ a: [1, undefined, '3'] })).toEqual('a=1&a=3');
    expect(stringifyQuery({ a: [1, undefined, '3', undefined] })).toEqual('a=1&a=3');
  });

  it('stringifies arrays', () => {
    expect(stringifyQuery({ e: ['b', 'a'] })).toEqual('e=b&e=a');
  });

  it('encodes values', () => {
    expect(stringifyQuery({ e: '%', b: 'c' })).toEqual('e=%25&b=c');
  });

  it('encodes values in arrays', () => {
    expect(stringifyQuery({ e: ['%', 'a'], b: 'c' })).toEqual('e=%25&e=a&b=c');
  });

  it('encodes = in key', () => {
    expect(stringifyQuery({ '=': 'a' })).toEqual('%3D=a');
  });

  it('keeps = in value', () => {
    expect(stringifyQuery({ a: '=' })).toEqual('a==');
  });

  it('protects against prototype pollution', () => {
    const obj: any = { a: '1' };
    (Object.prototype as any)._polluted = 'should-not-appear';
    try {
      const result = stringifyQuery(obj);
      expect(result).not.toContain('polluted');
      expect(result).not.toContain('_polluted');
    } finally {
      delete (Object.prototype as any)._polluted;
    }
  });

  it('handles many keys efficiently', () => {
    const query: Record<string, string> = {};
    const expectedParts: string[] = [];
    for (let i = 0; i < 100; i++) {
      query[`key${i}`] = `val${i}`;
      expectedParts.push(`key${i}=val${i}`);
    }
    expect(stringifyQuery(query)).toBe(expectedParts.join('&'));
  });
});
