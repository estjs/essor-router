import { describe, expect, it } from 'vitest'
import { normalizeQuery } from '../src/query'

describe('normalizeQuery', () => {
  it('normalizes number and nullish values', () => {
    expect(
      normalizeQuery({
        page: 1,
        q: '',
        empty: null,
        skip: undefined,
      }),
    ).toEqual({
      page: '1',
      q: '',
      empty: null,
    })
  })

  it('normalizes array values and keeps nulls', () => {
    expect(
      normalizeQuery({
        ids: [1, '2', null, undefined],
      }),
    ).toEqual({
      ids: ['1', '2', null, null],
    })
  })

  it('returns empty object for empty input', () => {
    expect(normalizeQuery({})).toEqual({})
    expect(normalizeQuery(undefined as any)).toEqual({})
    expect(normalizeQuery(null as any)).toEqual({})
  })

  it('converts boolean values to strings', () => {
    expect(
      normalizeQuery({
        active: true as any,
        disabled: false as any,
      }),
    ).toEqual({
      active: 'true',
      disabled: 'false',
    })
  })

  it('normalizes array with all nullish values', () => {
    expect(
      normalizeQuery({
        ids: [null, undefined, null],
      }),
    ).toEqual({
      ids: [null, null, null],
    })
  })

  it('keeps empty string as a valid value', () => {
    expect(
      normalizeQuery({
        search: '',
        tag: '0',
      }),
    ).toEqual({
      search: '',
      tag: '0',
    })
  })

  it('normalizes string-only array without modification', () => {
    expect(
      normalizeQuery({
        tags: ['a', 'b', 'c'],
      }),
    ).toEqual({
      tags: ['a', 'b', 'c'],
    })
  })
})
