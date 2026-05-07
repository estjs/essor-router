# unplugin-essor-router

> File-system based routes and typed route generation for [Essor Router](https://github.com/estjs/essor-router). Supports Vite, Rollup, Webpack, Rolldown, and esbuild.

[![npm](https://img.shields.io/npm/v/unplugin-essor-router)](https://www.npmjs.com/package/unplugin-essor-router)
[![license](https://img.shields.io/npm/l/unplugin-essor-router)](https://github.com/estjs/essor-router/blob/main/LICENSE)

## Features

- 📁 **File-based routing** — auto-generates routes from `src/pages/`
- ⚙️ **Config-based routing** — generate types from an explicit route config file (no file scanning needed)
- 🔤 **Typed routes** — generates `typed-router.d.ts` for full TypeScript autocompletion on route names and params
- ⚡ **HMR support** — live updates in development when pages or config change
- 🎯 **`defineRoute()` macro** — per-page metadata, loaders, search params with type inference

---

## Installation

```bash
pnpm add -D unplugin-essor-router
```

---

## Quick Start

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import routerPlugin from 'unplugin-essor-router/vite'

export default defineConfig({
  plugins: [
    routerPlugin({
      routesFolder: 'src/pages',     // default
      dts: 'typed-router.d.ts',      // default
    }),
  ],
})
```

Other bundlers: import from `unplugin-essor-router/rollup`, `/webpack`, `/rolldown`, `/esbuild`.

---

## Routing Modes

### Mode 1 — File-based Routes

Place `.tsx` / `.ts` files under `src/pages/`. Routes are generated automatically:

| File | Route Path | Route Name |
|------|-----------|-----------|
| `src/pages/index.tsx` | `/` | `/` |
| `src/pages/about.tsx` | `/about` | `/about` |
| `src/pages/users/[id].tsx` | `/users/:id` | `/users/[id]` |
| `src/pages/users/[id]/posts.tsx` | `/users/:id/posts` | `/users/[id]/posts` |
| `src/pages/[...all].tsx` | `/:all(.*)` | `/[...all]` |

**Conventions:**

- `index.tsx` → index route of the parent
- `_parent.tsx` → layout-only node (wraps children, no name)
- `[[id]].tsx` → optional param (`/post/:id?`)
- `[...slug].tsx` → catch-all param

### Mode 2 — Config-based Routes

Define routes explicitly in a config file. The plugin statically analyzes it at build time and generates the same `typed-router.d.ts`:

```ts
// src/routes.config.ts
import { defineConfigRoutes } from 'unplugin-essor-router'

export default defineConfigRoutes([
  {
    name: 'home',
    path: '/',
    component: () => import('./pages/Home.tsx'),
  },
  {
    name: 'users-id',
    path: '/users/:id',
    component: () => import('./pages/UserDetail.tsx'),
  },
  {
    name: 'users',
    path: '/users',
    component: () => import('./pages/Users.tsx'),
    children: [
      {
        name: 'users-id-posts',
        path: 'posts',
        component: () => import('./pages/UserPosts.tsx'),
      },
    ],
  },
])
```

```ts
// vite.config.ts
routerPlugin({
  configRoutes: 'src/routes.config.ts',
  dts: 'typed-router.d.ts',
})
```

`defineConfigRoutes()` is a zero-cost identity function used by the plugin to locate the config entry point.


---

## Options

```ts
type Options = {
  // ──── File-based routing ────────────────────────────────────
  /** Folder(s) to scan for route files. @default 'src/pages' */
  routesFolder?: string | RoutesFolderOption | Array<string | RoutesFolderOption>

  /** File extensions to include. @default ['.tsx', '.ts', '.jsx', '.js'] */
  extensions?: string[]

  /** Glob patterns to exclude (relative to cwd). @default [] */
  exclude?: string | string[]

  /** Glob pattern for files inside routesFolder. @default ['**\/*'] */
  filePatterns?: string | string[]

  // ──── Config-based routing ───────────────────────────────────
  /** Path to a defineConfigRoutes() file for config-based type generation. */
  configRoutes?: string

  // ──── Code generation ─────────────────────────────────────────
  /** How page components are imported. @default 'async' */
  importMode?: 'sync' | 'async' | ((filepath: string) => 'sync' | 'async')

  /** Custom route name function. */
  getRouteName?: (node: TreeNode) => string

  /** Hook to extend or modify individual routes. */
  extendRoute?: (route: EditableTreeNode) => void | Promise<void>

  /** Hook called before writing generated files. */
  beforeWriteFiles?: (rootRoute: EditableTreeNode) => void | Promise<void>

  // ──── Type generation ─────────────────────────────────────────
  /** Generate typed-router.d.ts. @default true if TypeScript is installed */
  dts?: boolean | string

  /** Project root directory. @default process.cwd() */
  root?: string

  // ──── Dev ────────────────────────────────────────────────────
  /** Watch for file changes. @default !process.env.CI */
  watch?: boolean

  /** Enable debug logs. @default false */
  logs?: boolean

  // ──── Path parsing ────────────────────────────────────────────
  /** Options for path segment parsing. */
  pathParser?: { dotNesting?: boolean }  // default: { dotNesting: true }

  // ──── Experimental ────────────────────────────────────────────
  experimental?: {
    /** Vite only: auto-export data loaders from matched files. */
    autoExportsDataLoaders?: string | string[]
    /** Enable custom param parsers. */
    paramParsers?: boolean | { dir?: string | string[] }
  }
}
```

### `RoutesFolderOption` (advanced multi-source)

```ts
type RoutesFolderOption = {
  src: string
  path?: string | ((filepath: string) => string)
  filePatterns?: string | string[] | ((existing: string[]) => string[])
  exclude?: string | string[] | ((existing: string[]) => string[])
  extensions?: string[] | ((existing: string[]) => string[])
}
```

---

## Virtual Modules

Import in your router setup:

```ts
import { createRouter } from 'essor-router'
// File-based: auto-generated flat routes array
import { routes }   from 'essor-router/auto-routes'
// Experimental: pre-built static resolver
import { resolver } from 'essor-router/auto-resolver'

const router = createRouter({ history: 'history', routes })
```

---

## `defineRoute()` Macro

Add per-page route metadata with full TypeScript inference:

```ts
// src/pages/users/[id].tsx
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  name: 'users-id',
  meta: { requiresAuth: true },
  params: {
    path: { id: 'int' },         // typed param parser
    query: {
      tab: { parser: 'string', default: 'overview' }
    },
  },
  loader: async ({ params }) => {
    return fetchUser(params.id)
  },
})

export default function UserPage() { /* ... */ }
```

Extracted fields: `name`, `path`, `alias`, `meta`, `props`, `params.path`, `params.query`, `validateSearch`, `loader`, `beforeLoad`, `start`.

---

## Generated `typed-router.d.ts`

The plugin writes this file automatically. Include it in `tsconfig.json`:

```json
{
  "include": ["typed-router.d.ts", "src/**/*"]
}
```

What it provides:
- `RouteNamedMap` — route name → path/params type mapping
- `RouteTreeMap` — search/loader/beforeLoad type inference
- `_RouteFileInfoMap` — file path → route name mapping

---

## Auto-imports

The plugin exports `essorRouterAutoImports` for use with `unplugin-auto-import`:

```ts
import AutoImport from 'unplugin-auto-import/vite'
import { essorRouterAutoImports } from 'unplugin-essor-router'

// in vite.config.ts plugins:
AutoImport({ imports: [essorRouterAutoImports] })
```

Includes: `useRoute`, `useRouter`, `onBeforeRouteUpdate`, `onBeforeRouteLeave`, `definePage`, `defineRoute`.

---

## Recipes

### Prefix a folder with a path segment

```ts
routerPlugin({
  routesFolder: [
    'src/pages',
    { src: 'src/admin', path: 'admin/' },
  ],
})
```

### Lazy-load only specific pages

```ts
routerPlugin({
  importMode: (filepath) =>
    filepath.includes('/heavy/') ? 'async' : 'sync',
})
```

### Per-folder file extension override

```ts
routerPlugin({
  routesFolder: [
    {
      src: 'src/docs',
      extensions: ['.md'],   // only .md files as routes
    },
    'src/pages',
  ],
})
```

---

## License

[MIT](../../LICENSE) © [jiangxd](https://github.com/jiangxd2016)
