# Query String Handling

Query string handling controls how URL search parameters (the part after `?`) are parsed, normalized, and stringified during navigation. `essor-router` provides built-in query string encoding/decoding with full TypeScript support and customization hooks.

## Overview

When you navigate to `/search?q=hello&page=2&sort=date`, the router parses the query string into a structured object and makes it available through `useRoute().query`. You can also set query params when calling `router.push()` or `router.replace()`, and the router automatically serializes them into the URL.

The router exports the default parser and stringifier, which you can replace via `createRouter()` options:

```tsx
import { createRouter, parseQuery, stringifyQuery } from 'essor-router'

const router = createRouter({
  history: 'history',
  routes: [...],
  parseQuery,    // default: built-in parseQuery
  stringifyQuery, // default: built-in stringifyQuery
})
```

## Accessing Query Params

### Via `useRoute()`

The `useRoute()` composable exposes the parsed query as a `LocationQuery` object:

```tsx
import { useRoute } from 'essor-router'

function SearchResults() {
  const route = useRoute()

  const keyword = route.query.q        // string | null
  const page = Number(route.query.page) // convert to number
  const sort = route.query.sort        // string | null

  return (
    <div>
      <p>Searching for: {keyword}</p>
      <p>Page: {page || 1}</p>
      <p>Sort by: {sort || 'relevance'}</p>
    </div>
  )
}
```

Each value is `string | null`. Absent params are `undefined`. A param like `?isNull&isEmpty=&other=other` parses to:

```ts
{
  isNull: null,     // key present but no value
  isEmpty: '',      // key present with empty value (=)
  other: 'other',   // key with value
}
```

### Via Navigation Guards

Query params are available on the `to` and `from` route objects:

```tsx
router.beforeEach((to, from, next) => {
  if (to.query.requireAuth !== undefined && !isAuthenticated()) {
    next('/login')
  } else {
    next()
  }
})
```

### Checking for Presence

Use `in` to distinguish between absent params and empty/null params:

```tsx
if ('q' in route.query) {
  console.log('Search query is present:', route.query.q) // string | null
}
```

## Setting Query Params in Navigation

### Using `router.push()` and `router.replace()`

Pass a `query` object when navigating:

```tsx
import { useRouter } from 'essor-router'

function SearchBar() {
  const router = useRouter()

  function search(keyword: string) {
    router.push({
      path: '/search',
      query: {
        q: keyword,
        page: '1',
      },
    })
  }

  return <input onKeydown={...} />
}
```

### Updating Only Query Params

Navigate to the current route with modified query to change only the query string:

```tsx
function Pagination({ currentPage }: { currentPage: number }) {
  const router = useRouter()
  const route = useRoute()

  function goToPage(page: number) {
    router.push({
      path: route.path,
      query: {
        ...route.query,
        page: String(page),
      },
    })
  }

  return <button onClick={() => goToPage(currentPage + 1)}>Next</button>
}
```

### Type-Safe Query Navigation

When using file-based routing with generated types, `query` is type-checked:

```tsx
import { useRouter } from 'essor-router'

const router = useRouter()

// ✅ OK - with typed routes, string values are expected
router.push({ name: 'search', query: { q: 'hello', page: '1' } })

// ❌ Type error if number is passed (query values must be string | null)
// router.push({ name: 'search', query: { page: 1 } })
```

## Default Query Parsing and Stringifying

### `parseQuery(search: string): LocationQuery`

The default parser transforms a `?key=value&foo=bar` string into a `LocationQuery` object:

```ts
parseQuery('?q=hello&page=2&tag=js&tag=ts')
// => { q: 'hello', page: '2', tag: ['js', 'ts'] }
```

Key behaviors:
- Leading `?` is optional
- Repeated keys are collected into arrays: `?tag=a&tag=b` → `{ tag: ['a', 'b'] }`
- Keys without `=` are set to `null`: `?flag` → `{ flag: null }`
- Keys with empty values are set to `''`: `?key=` → `{ key: '' }`
- `+` characters are decoded as spaces
- Standard percent-encoding is supported (`%20`, `%2F`, etc.)

### `stringifyQuery(query: LocationQueryRaw): string`

The default stringifier does the inverse, producing a query string **without** the leading `?`:

```ts
stringifyQuery({ q: 'hello', page: '2', tag: ['js', 'ts'] })
// => 'q=hello&page=2&tag=js&tag=ts'
```

Key behaviors:
- `undefined` values are omitted
- `null` values produce `key` (no `=`): `{ flag: null }` → `flag`
- Empty strings produce `key=`: `{ empty: '' }` → `empty=`
- Numbers are converted to strings: `{ page: 1 }` → `page=1`

## Custom `parseQuery` / `stringifyQuery`

Provide custom functions to change how queries are encoded and decoded:

### Using `URLSearchParams`

```tsx
import { createRouter } from 'essor-router'

const router = createRouter({
  history: 'history',
  routes: [...],
  parseQuery(search: string) {
    const params = new URLSearchParams(search)
    const query: Record<string, string | string[] | null> = {}
    for (const [key, value] of params.entries()) {
      query[key] = value
    }
    return query
  },
  stringifyQuery(query: Record<string, any>) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value != null) {
        params.set(key, String(value))
      }
    }
    return params.toString()
  },
})
```

### Using a Third-Party Library (e.g., `qs`)

```tsx
import { createRouter } from 'essor-router'
import qs from 'qs'

const router = createRouter({
  history: 'history',
  routes: [...],
  parseQuery(search: string) {
    return qs.parse(search, { ignoreQueryPrefix: true })
  },
  stringifyQuery(query) {
    return qs.stringify(query, { addQueryPrefix: false })
  },
})
```

> [!WARNING]
> If you use a custom `stringifyQuery`, make sure it does **not** prepend a `?`. The router handles the `?` separator internally between the path and query string.

## Query Value Types

### `LocationQueryValue = string | null`

A single query value after parsing. `null` means the key exists without a value (e.g., `?flag`).

### `LocationQuery = Record<string, LocationQueryValue | LocationQueryValue[]>`

The normalized query object available on `route.query`. Repeated keys produce arrays.

### `LocationQueryValueRaw = string | null | number | undefined`

What you can pass when setting query params. Numbers are coerced to strings, `undefined` is omitted.

### `LocationQueryRaw = Record<string | number, LocationQueryValueRaw | LocationQueryValueRaw[]>`

The loose type accepted by `router.push()`/`router.replace()`.

```tsx
// This is valid input:
router.push({
  path: '/search',
  query: {
    q: 'hello',          // string -> string
    page: 1,             // number -> '1'
    flag: null,          // null   -> 'flag' in URL
    tag: ['js', 'ts'],   // array  -> 'tag=js&tag=ts'
    skip: undefined,     // undefined -> omitted
  },
})
```

## Removing Query Params

Set a param to `undefined` or omit it to remove it:

```tsx
// Remove the `q` param while keeping others
router.push({
  path: route.path,
  query: {
    ...route.query,
    q: undefined, // removed from URL
  },
})
```

To clear all query params:

```tsx
router.push({
  path: route.path,
  query: {},
})
```

## Preserving Existing Query Params

Spread the current query to keep existing params when adding or overriding:

```tsx
function updateFilter(key: string, value: string) {
  router.push({
    path: route.path,
    query: {
      ...route.query,   // preserve existing params
      [key]: value,     // override specific param
    },
  })
}
```

To merge query params when navigating to a different route:

```tsx
router.push({
  name: 'search',
  query: {
    q: route.query.q, // carry over search term
    page: '1',        // reset to page 1
  },
})
```

## Query Params with `defineRoute()`

When using file-based routing with `defineRoute()`, you can configure query parameter parsers and validators:

```tsx
import { defineRoute } from 'essor-router'

export const route = defineRoute({
  params: {
    query: {
      keyword: {
        queryKey: 'q',
        parser: 'int',
        format: 'value',
        required: true,
      },
      page: {
        queryKey: 'p',
        format: 'value',
        default: 1,
      },
      tags: {
        queryKey: 'tag',
        format: 'array',
      },
    },
  },
  validateSearch: (input) => ({
    q: String(input.q ?? ''),
  }),
})
```

> [!NOTE]
> Enable query param parsers with `paramParsers: true` in your unplugin config.

## Practical Examples

### Search Filters

```tsx
function ProductFilters() {
  const router = useRouter()
  const route = useRoute()

  const category = (route.query.category as string) ?? 'all'
  const minPrice = (route.query.minPrice as string) ?? '0'
  const maxPrice = (route.query.maxPrice as string) ?? '1000'

  function setFilter(key: string, value: string | null) {
    router.push({
      path: route.path,
      query: {
        ...route.query,
        [key]: value,
      },
    })
  }

  return (
    <div class="filters">
      <select
        value={category}
        onChange={(e) => setFilter('category', e.currentTarget.value)}
      >
        <option value="all">All</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      <input
        type="range"
        min="0"
        max="1000"
        value={minPrice}
        onInput={(e) => setFilter('minPrice', e.currentTarget.value)}
      />
    </div>
  )
}
```

### Pagination

```tsx
function Pagination() {
  const router = useRouter()
  const route = useRoute()

  const currentPage = Number(route.query.page) || 1
  const totalPages = 10

  function goToPage(page: number) {
    router.push({
      name: 'products',
      query: {
        ...route.query,
        page: String(page),
      },
    })
  }

  return (
    <nav>
      <button
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        Next
      </button>
    </nav>
  )
}
```

### Sort Order

```tsx
function SortControls() {
  const router = useRouter()
  const route = useRoute()

  const currentSort = (route.query.sort as string) ?? 'relevance'
  const currentOrder = (route.query.order as string) ?? 'desc'

  function setSort(sort: string) {
    const order = sort === currentSort && currentOrder === 'asc' ? 'desc' : 'asc'
    router.push({
      path: route.path,
      query: { ...route.query, sort, order },
    })
  }

  return (
    <div>
      {['relevance', 'price', 'date'].map((field) => (
        <button onClick={() => setSort(field)}>
          {field}
          {field === currentSort && (currentOrder === 'asc' ? ' ▲' : ' ▼')}
        </button>
      ))}
    </div>
  )
}
```

### Tab Selection

```tsx
function TabPanel({ tabs }: { tabs: { id: string; label: string }[] }) {
  const router = useRouter()
  const route = useRoute()

  const activeTab = (route.query.tab as string) ?? tabs[0].id

  function selectTab(id: string) {
    router.replace({
      path: route.path,
      query: { ...route.query, tab: id },
    })
  }

  return (
    <div>
      <div class="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => selectTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div class="tab-content">
        {/* Render tab content based on activeTab */}
      </div>
    </div>
  )
}
```

### History-Aware Filter Reset

Preserve filters across back navigation by storing them in the URL:

```tsx
function FilterSidebar() {
  const router = useRouter()
  const route = useRoute()

  function resetFilters() {
    router.push({
      path: route.path,
      // Navigate with no filters - creates a clean history entry
      query: {},
    })
  }

  function applyFilter(filter: Record<string, string>) {
    router.push({
      path: route.path,
      query: { ...route.query, ...filter },
    })
  }

  return (
    <aside>
      <button onClick={resetFilters}>Reset All</button>
      {/* Filter controls */}
    </aside>
  )
}
```

## TypeScript Types

```tsx
// Full type definitions (available from 'essor-router')

type LocationQueryValue = string | null

type LocationQueryValueRaw = LocationQueryValue | number | undefined

type LocationQuery = Record<string, LocationQueryValue | LocationQueryValue[]>

type LocationQueryRaw = Record<
  string | number,
  LocationQueryValueRaw | LocationQueryValueRaw[]
>
```

> [!TIP]
> When using file-based routing with `typed-router.d.ts`, route params are fully typed including their query shapes. This enables autocomplete and type checking for `router.push({ name: '...', query: { ... } })`.

## Navigation with Query + Hash

Query params and hash fragments can be combined:

```tsx
router.push({
  path: '/docs',
  query: { section: 'api' },
  hash: '#scroll-behavior',
})
// Navigates to: /docs?section=api#scroll-behavior
```

The `route.hash` property provides access to the hash (without the `#`), and `route.query` provides the parsed query object. If you need to reactively watch for query changes, use `useRoute()` since the route object is a `Signal`.

## Query Reactivity

```tsx
import { useRoute, watch } from 'essor-router'
import { effect } from 'essor'

function App() {
  const route = useRoute()

  // The route signal updates reactively on query changes
  effect(() => {
    console.log('Current query:', route.query)
  })
}
```
