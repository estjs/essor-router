# Custom Param Parsers

Param parsers transform raw string route params (or query values) into typed values before they reach your components. Instead of writing `Number(route.params.id)` in every handler, you define a parser once and get `number` everywhere automatically.

## Overview

By default, all route params (from `path: '/users/:id'`) and query values are strings. Param parsers let you:

- **Transform** param strings to typed values (`string` → `number`, `string` → `Date`, etc.)
- **Validate** params at runtime (reject invalid values, provide defaults)
- **Get full TypeScript types** for your params in `useRoute()`, navigation, and loaders

Essor Router supports two kinds of parsers:
1. **Built-in parsers**: `int`, `bool` (shipped with the router)
2. **Custom parsers**: files you create in a `src/params/` folder (or any configured folder)

## Enabling Param Parsers

Param parsers are an **experimental feature**. Enable them in your `unplugin-essor-router` config:

```tsx
// vite.config.ts
import essorRouter from 'unplugin-essor-router/vite'

export default {
  plugins: [
    essorRouter({
      routesFolder: 'src/pages',
      experimental: {
        paramParsers: true,
      },
    }),
  ],
}
```

This enables the feature with the default `src/params/` folder. For a custom folder:

```tsx
essorRouter({
  experimental: {
    paramParsers: {
      dir: 'src/app/parsers',
    },
  },
})
```

For multiple folders:

```tsx
essorRouter({
  experimental: {
    paramParsers: {
      dir: ['src/params', 'src/shared/parsers'],
    },
  },
})
```

## Creating a Param Parser

A param parser is a file that exports two functions: `parse` and `get`.

### Parser Contract

```ts
// src/params/parserName.ts

export const parse = (
  value: string | string[] | null | undefined,
  options?: { format?: 'value' | 'array' },
) => {
  // Validate and transform the raw string input
  // Return undefined if parsing fails
}

export const get = (value: any) => {
  // Return the typed value for type inference
  // This function is only used for TypeScript type generation
}
```

| Export | Purpose | Called at |
|--------|---------|-----------|
| `parse(value, options?)` | Validates and transforms the raw string. Return `undefined` on failure | **Runtime** - during route matching |
| `get(value)` | Returns the typed value used for TypeScript type generation | **Build time** - for `.d.ts` generation only |

### Example: Integer Parser

```ts
// src/params/int.ts
export const parse = (value: string) => {
  const num = parseInt(value, 10)
  if (isNaN(num)) return undefined
  return num
}

export const get = (value: number) => value
```

> [!NOTE]
> `int` and `bool` are built-in parsers - you don't need to create them yourself. Create custom parsers only for types that aren't natively supported.

### Example: UUID Parser

```ts
// src/params/uuid.ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const parse = (value: string) => {
  if (!UUID_RE.test(value)) return undefined
  return value
}

export const get = (value: string) => value
```

### Example: Date Parser

```ts
// src/params/date.ts
export const parse = (value: string) => {
  const date = new Date(value)
  if (isNaN(date.getTime())) return undefined
  return date
}

export const get = (value: Date) => value
```

### Example: Enum Parser

```ts
// src/params/sortOrder.ts
const ALLOWED = ['asc', 'desc'] as const
type SortOrder = (typeof ALLOWED)[number]

export const parse = (value: string): SortOrder | undefined => {
  const v = value.toLowerCase()
  if (ALLOWED.includes(v as SortOrder)) {
    return v as SortOrder
  }
  return undefined
}

export const get = (value: SortOrder) => value
```

### Example: Boolean Parser (Extended)

While `bool` is built-in, here's how you'd create one with additional accepted values:

```ts
// src/params/extendedBool.ts
const TRUTHY = ['1', 'true', 'yes', 'on']
const FALSY = ['0', 'false', 'no', 'off']

export const parse = (value: string): boolean | undefined => {
  const v = value.toLowerCase()
  if (TRUTHY.includes(v)) return true
  if (FALSY.includes(v)) return false
  return undefined
}

export const get = (value: boolean) => value
```

### Error Handling in Parsers

When a parser returns `undefined`, the route either:
- **Does not match** (for path params), meaning the router tries the next matching route
- **Falls back to the default** (for query params), if a `default` is configured
- Returns `undefined` in the param value (if the param is optional)

```ts
// src/params/positiveInt.ts
export const parse = (value: string) => {
  const num = parseInt(value, 10)
  if (isNaN(num) || num < 0) return undefined
  return num
}

export const get = (value: number) => value
```

## Using Parsers in File-Based Routes

### Route File Naming Convention

Append the parser name to the param in square brackets using `=`:

```
users/[id=int].tsx    → /users/:id  (parsed as number)
posts/[slug].tsx      → /posts/:slug (no parser, stays string)
orders/[date=date].tsx → /orders/:date (parsed as Date)
```

The file `users/[id=int].tsx` generates a route where `params.id` is typed as `number`.

### Using `defineRoute()` for Inline Parsers

Define parsers directly in your page file using `defineRoute()`:

```tsx
// src/pages/users/[id].tsx
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  params: {
    path: {
      id: 'int', // Uses the built-in int parser
    },
  },
})

function UserPage() {
  const route = useRoute()
  // route.params.id is typed as `number`!
}

export default UserPage
```

### Using `defineRoute()` with Custom Parsers

```tsx
// src/pages/orders/[date].tsx
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  params: {
    path: {
      date: 'date', // References src/params/date.ts
    },
  },
})

// Now route.params.date is typed as Date
```

### Combining Parsers with Path Pattern Constraints

You can use both a parser and a regex constraint on the same param:

```tsx
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  path: '/users/:id(\\d+)',
  params: {
    path: { id: 'int' },
  },
})
```

The regex `\\d+` ensures only numeric segments reach the parser. The `int` parser then converts the matched string to a `number`.

## Using Parsers in `defineRoute()` with `params.path`

The `params.path` option accepts an object where keys are param names and values are parser names:

```tsx
export const route = defineRoute({
  params: {
    path: {
      category: 'enum',      // → string (from src/params/enum.ts)
      page: 'int',           // → number (built-in)
      isPublished: 'bool',   // → boolean (built-in)
    },
  },
})
```

When `experimental.paramParsers` is enabled with a configured `dir`, the unplugin scans the folders for parser files, reads their `get` function return types, and flows those types into `typed-router.d.ts`. This means:

```tsx
// In any component on this route:
const route = useRoute()
route.params.category  // typed as ReturnType<typeof get> from src/params/enum.ts
route.params.page      // typed as number (built-in int parser)
route.params.isPublished // typed as boolean (built-in bool parser)
```

## Built-in Parsers

The router ships with two native parsers. You don't need to create parser files for them.

### `int`

Converts a numeric string to a `number`. Returns `undefined` if the value is not a valid integer.

```tsx
// File: users/[id=int].tsx
const route = useRoute()
route.params.id // type: number
```

### `bool`

Converts `'true'` / `'false'` to `boolean`. Returns `undefined` for any other value.

```tsx
// File: posts/[published=bool].tsx
const route = useRoute()
route.params.published // type: boolean
```

## Query Param Parsers (Experimental)

Query param parsers work the same way but are configured through `defineRoute()` instead of route file names:

```tsx
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  params: {
    query: {
      page: {
        queryKey: 'p',
        parser: 'int',
        format: 'value',
        default: 1,
      },
      tags: {
        queryKey: 'tag',
        format: 'array',
        parser: 'int',
      },
      keyword: {
        queryKey: 'q',
        required: true,
      },
    },
  },
})
```

### Query Parser Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `queryKey` | `string` | Same as key name | The actual query parameter name in the URL |
| `parser` | `ParamParserType` | `undefined` | Parser name (built-in or custom) |
| `format` | `'value' \| 'array'` | `'value'` | Take the first value or all values as array |
| `default` | `T \| (() => T)` | `undefined` | Default value if param is missing or parsing fails |
| `required` | `boolean` | `false` | If `true`, the route won't match if the param is missing or fails parsing |

### Query Parser Example: Search with Typed Params

```tsx
import { defineRoute } from 'essor-router/experimental'
import { useRoute } from 'essor-router'

export const route = defineRoute({
  params: {
    query: {
      query: { queryKey: 'q', required: true },
      page: { queryKey: 'p', parser: 'int', default: 1 },
      limit: { queryKey: 'n', parser: 'int', format: 'value', default: 20 },
    },
  },
})

function SearchPage() {
  const route = useRoute()
  // route.query is typed with the transformed values
}
```

## TypeScript Integration

When param parsers are active, the generated `typed-router.d.ts` includes:

1. **Parser type declarations** - One type per parser file, derived from the `get()` return type
2. **Parsed param types** - Each route's params include the transformed types
3. **Parser name union** - The set of available parser names for autocomplete in `defineRoute()`

### Generated Types Structure

For a route `users/[id=int].tsx` with a custom `uuid` parser file:

```ts
// In typed-router.d.ts:

type Param_int = ReturnType<NonNullable<typeof import('./params/int.js').parser['get']>>
// → number

type Param_uuid = ReturnType<NonNullable<typeof import('./params/uuid.js').parser['get']>>
// → string

// Route type:
interface RouteNamedMap {
  'users-id': RouteRecordInfo<
    'users-id',
    '/users/:id',
    { id: string | number | null | undefined },  // paramsRaw (input)
    { id: Param_int },                             // params (parsed output)
    RouteMeta
  >
}
```

### Parser Autocomplete

In `defineRoute()`, parser names are autocompleted:

```tsx
defineRoute({
  params: {
    path: {
      id: ''  // ← autocompletes: 'int' | 'bool' | 'uuid' | 'date' | ...
    },
  },
})
```

## Error Handling When Parsers Fail

### Path Params

If a path param parser returns `undefined` (fails), the route **does not match**. The router continues trying other routes in the tree.

```tsx
// Route: /users/:id, parser: int
// URL: /users/abc  → parser fails (NaN), route doesn't match → 404
// URL: /users/42   → parser succeeds, params.id = 42
```

This means you can define overlapping routes with different parser requirements:

```tsx
// src/pages/users/[id=int].tsx      → matches /users/42
// src/pages/users/[username].tsx     → matches /users/john
```

### Query Params

Failed query parsers use the `default` value. If no default is set and `required` is `true`, the route won't match:

```tsx
defineRoute({
  params: {
    query: {
      page: { queryKey: 'p', parser: 'int', default: 1 },
      // ?p=abc → fails parse, uses default(1)
      // ?p=5   → succeeds, page = 5
      // (absent) → uses default(1)
    },
  },
})
```

If a required query param fails or is missing with no default:

```tsx
defineRoute({
  params: {
    query: {
      productId: { parser: 'int', required: true },
      // ?productId=abc → parser fails, route doesn't match
      // ?productId=42  → parser succeeds
      // (absent) → parser fails (no value), route doesn't match
    },
  },
})
```

## Troubleshooting

### Parser Not Found Warning

```
Parameter parser "myParser" not found for route "/users/:id".
```

**Cause**: The parser name used in your route doesn't match any file in the configured `dir`.

**Fix**: Create the parser file or check the parser name spelling in your route definition.

### Parser Type Not Shown in Autocomplete

**Cause**: The unplugin hasn't re-scanned the parsers folder, or the `.d.ts` is stale.

**Fix**:
1. Restart your dev server
2. Verify the parser file is inside the configured `dir`
3. Check that the parser file has correct `parse` and `get` exports
4. Verify `experimental.paramParsers` is enabled in your config

### Typescript Error: Type 'string' Not Assignable to Type 'number'

**Cause**: The `.d.ts` hasn't been regenerated after adding a parser.

**Fix**: Remove `typed-router.d.ts` and restart the dev server. It will be regenerated.

## Configuration Reference

```tsx
// vite.config.ts
import essorRouter from 'unplugin-essor-router/vite'

export default {
  plugins: [
    essorRouter({
      experimental: {
        // Enable param parsers with default settings (scans src/params/)
        paramParsers: true,

        // Or: customize the parser folder(s)
        paramParsers: {
          dir: 'src/app/parsers',
        },

        // Or: multiple folders
        paramParsers: {
          dir: ['src/params', 'src/shared/parsers'],
        },
      },
    }),
  ],
}
```

### Parser File Requirements

Each parser file (e.g., `src/params/myParser.ts`) must export:

```ts
export const parse = (value: string | string[] | null | undefined): YourType | undefined => { ... }
export const get = (value: YourType): YourType => { ... }
```

- **`parse`** runs at runtime to validate and transform values
- **`get`** runs at build time for TypeScript type generation
- The filename (without extension) becomes the parser name used in routes
