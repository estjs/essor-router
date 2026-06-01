import {
  encodeHash,
  encodeParam,
  encodePath,
  encodeQueryKey,
  encodeQueryValue,
  // decode,
} from '../src/encoding';

describe('encoding', () => {
  // all ascii chars with a non ascii char at the beginning
  // let allChars = ''
  // for (let i = 32; i < 127; i++) allChars += String.fromCharCode(i)

  // per RFC 3986 (2005), strictest safe set
  const unreservedSet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~';
  // Other safePerSpec sets are defined by following the URL Living standard https://url.spec.whatwg.org without chars from unreservedSet

  let nonPrintableASCII = '';
  let encodedNonPrintableASCII = '';
  for (let i = 0; i < 32; i++) {
    nonPrintableASCII += String.fromCharCode(i);
    const hex = i.toString(16).toUpperCase();
    encodedNonPrintableASCII += `%${hex.length > 1 ? hex : `0${hex}`}`;
  }

  describe('params', () => {
    // excludes ^ and ` even though they are safe per spec because all browsers encode it when manually entered
    const safePerSpec = "!$&'()*+,:;=@[]_|";
    const toEncode = ' "<>#?{}/^`';
    const encodedToEncode = toEncode
      .split('')
      .map((c) => {
        const hex = c.charCodeAt(0).toString(16).toUpperCase();
        return `%${hex.length > 1 ? hex : `0${hex}`}`;
      })
      .join('');

    it('does not encode safe chars', () => {
      expect(encodeParam(unreservedSet)).toBe(unreservedSet);
    });

    it('encodes non-ascii', () => {
      expect(encodeParam('é')).toBe('%C3%A9');
    });

    it('encodes non-printable ascii', () => {
      expect(encodeParam(nonPrintableASCII)).toBe(encodedNonPrintableASCII);
    });

    it('does not encode a safe set', () => {
      expect(encodeParam(safePerSpec)).toBe(safePerSpec);
    });

    it('encodes a specific charset', () => {
      expect(encodeParam(toEncode)).toBe(encodedToEncode);
    });
  });

  describe('query params', () => {
    const safePerSpec = "!$'*,:;@[]_|?/{}^()`";
    const toEncodeForKey = '"<>#&=';
    const toEncodeForValue = '"<>#&';
    const encodedToEncodeForKey = toEncodeForKey
      .split('')
      .map((c) => {
        const hex = c.charCodeAt(0).toString(16).toUpperCase();
        return `%${hex.length > 1 ? hex : `0${hex}`}`;
      })
      .join('');
    const encodedToEncodeForValue = toEncodeForValue
      .split('')
      .map((c) => {
        const hex = c.charCodeAt(0).toString(16).toUpperCase();
        return `%${hex.length > 1 ? hex : `0${hex}`}`;
      })
      .join('');

    it('does not encode safe chars', () => {
      expect(encodeQueryValue(unreservedSet)).toBe(unreservedSet);
      expect(encodeQueryKey(unreservedSet)).toBe(unreservedSet);
    });

    it('encodes non-ascii', () => {
      expect(encodeQueryValue('é')).toBe('%C3%A9');
      expect(encodeQueryKey('é')).toBe('%C3%A9');
    });

    it('encodes non-printable ascii', () => {
      expect(encodeQueryValue(nonPrintableASCII)).toBe(encodedNonPrintableASCII);
      expect(encodeQueryKey(nonPrintableASCII)).toBe(encodedNonPrintableASCII);
    });

    it('does not encode a safe set', () => {
      expect(encodeQueryValue(safePerSpec)).toBe(safePerSpec);
      expect(encodeQueryKey(safePerSpec)).toBe(safePerSpec);
    });

    it('encodes a specific charset', () => {
      expect(encodeQueryKey(toEncodeForKey)).toBe(encodedToEncodeForKey);
      expect(encodeQueryValue(toEncodeForValue)).toBe(encodedToEncodeForValue);
    });

    it('encodes space as +', () => {
      expect(encodeQueryKey(' ')).toBe('+');
      expect(encodeQueryValue(' ')).toBe('+');
    });

    it('encodes +', () => {
      expect(encodeQueryKey('+')).toBe('%2B');
      expect(encodeQueryValue('+')).toBe('%2B');
    });
  });

  describe('hash', () => {
    const safePerSpec = "!$'*+,:;@[]_|?/{}^()#&=";
    const toEncode = ' "<>`';
    const encodedToEncode = toEncode
      .split('')
      .map((c) => {
        const hex = c.charCodeAt(0).toString(16).toUpperCase();
        return `%${hex.length > 1 ? hex : `0${hex}`}`;
      })
      .join('');

    it('does not encode safe chars', () => {
      expect(encodeHash(unreservedSet)).toBe(unreservedSet);
    });

    it('encodes non-ascii', () => {
      expect(encodeHash('é')).toBe('%C3%A9');
    });

    it('encodes non-printable ascii', () => {
      expect(encodeHash(nonPrintableASCII)).toBe(encodedNonPrintableASCII);
    });

    it('does not encode a safe set', () => {
      expect(encodeHash(safePerSpec)).toBe(safePerSpec);
    });

    it('encodes a specific charset', () => {
      expect(encodeHash(toEncode)).toBe(encodedToEncode);
    });
  });

  describe('single-pass edge cases', () => {
    it('encodes mixed special characters in query value', () => {
      expect(encodeQueryValue('a+b c#d&e')).toBe('a%2Bb+c%23d%26e');
    });

    it('encodes query key with equals sign', () => {
      expect(encodeQueryKey('foo=bar')).toBe('foo%3Dbar');
    });

    it('encodes path with hash and question mark', () => {
      expect(encodePath('path#frag?query')).toBe('path%23frag%3Fquery');
    });

    it('encodes param with slash', () => {
      expect(encodeParam('a/b')).toBe('a%2Fb');
    });

    it('encodes hash with all special chars', () => {
      // Hash un-encodes { } ^ | [ ] but keeps backtick encoded
      expect(encodeHash('a{b}c^d`e|f[g]h')).toBe('a{b}c^d%60e|f[g]h');
    });

    it('handles strings with only safe characters', () => {
      expect(encodeQueryValue('abcdef')).toBe('abcdef');
      expect(encodeQueryKey('abcdef')).toBe('abcdef');
      expect(encodeHash('abcdef')).toBe('abcdef');
      expect(encodePath('abcdef')).toBe('abcdef');
      expect(encodeParam('abcdef')).toBe('abcdef');
    });

    it('handles empty string', () => {
      expect(encodeQueryValue('')).toBe('');
      expect(encodeQueryKey('')).toBe('');
      expect(encodeHash('')).toBe('');
      expect(encodePath('')).toBe('');
      expect(encodeParam('')).toBe('');
    });

    it('handles null/undefined param', () => {
      expect(encodeParam(null)).toBe('');
      expect(encodeParam(undefined)).toBe('');
    });
  });
});
