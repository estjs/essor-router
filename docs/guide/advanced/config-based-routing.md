# Config-Based Routing

Config-based routing lets you define routes explicitly in a TypeScript/JavaScript configuration file instead of relying on file-system scanning. This gives you full control over route names, paths, component mappings, and nested structures.

## Overview

By default, `essor-router-unplugin` scans the `routesFolder` directory and generates routes from the file system (`mode: 'file'`). Config-based routing (`mode: 'config'`) offers an alternative where you declare your route tree in a single config file.

**When to use config-based routing:**

- You prefer explicit route declarations over file-system conventions
- Your route structure doesn't map cleanly to a file tree
- You want fine-grained control over route names and component assignments
- You're migrating from a hand-maintained route array and want to keep that workflow

**Key differences from file-based routing:**

| Aspect | File-Based | Config-Based |
|--------|-----------|-------------|
| Route discovery | File system scanning | Static Babel analysis of config file |
| Route naming | Auto-generated from file path | Explicit via `name` property |
| Adding a route | Create a new file | Add an entry to the config array |
| Component mapping | File path = component | Explicit `component: () => import(...)` |
| `defineRoute()` support | ✅ (extracted per-file) | ⚠️ (requires explicit component path) |
| HMR | File changes trigger regeneration | Config file changes trigger regeneration |

## Setting Up Config-Based Routing

### 1. Create a Route Config File

Create a file like `src/routes.config.ts`:

```ts
// src/routes.config.ts
import { defineConfigRoutes } from 'essor-router-unplugin'

export default defineConfigRoutes([
  { name: 'home', path: '/', component: () => import('./pages/Home.tsx') },
  { name: 'about', path: '/about', component: () => import('./pages/About.tsx') },
  { name: 'users', path: '/users', component: () => import('./pages/Users.tsx') },
])
```

### 2. Configure the Unplugin

Update your build config to use `mode: 'config'`:

```tsx
// vite.config.ts
import essorRouter from 'essor-router-unplugin/vite'

export default {
  plugins: [
    essorRouter({
      mode: 'config',
      configRoutes: 'src/routes.config.ts',
      dts: 'typed-router.d.ts',
    }),
  ],
}
```

### 3. Use Generated Routes

Import the generated route records in your router setup:

```ts
// src/router.ts
import { createRouter } from 'essor-router'
import { routes } from 'essor-router/auto-routes'
import { resolver } from 'essor-router/auto-resolver'

export const router = createRouter({
  history: 'history',
  routes,
  resolver,
})
```

This works identically to file-based routing - the generated virtual modules are the same regardless of which mode produces them.

## `defineConfigRoutes()` Identity Function

`defineConfigRoutes()` is a zero-cost identity function that:
- Provides TypeScript type checking for the route array
- Serves as a marker for the unplugin to locate the config entry point during static analysis
- Returns the exact same array you pass in (no runtime overhead)

```ts
function defineConfigRoutes<T extends readonly object[]>(routes: T): T {
  return routes
}
```

**Rules for static extraction:**

1. Use `export default defineConfigRoutes([...])` as the default export
2. Route `path` values **must** be string literals (not variables or template literals)
3. Route `name` values should be string literals
4. Component references **must** use the arrow-function dynamic import syntax: `() => import('...')`
5. The import path for components must be a string literal (relative to the config file)

```ts
// ✅ Static extraction works
defineConfigRoutes([
  { path: '/', component: () => import('./pages/Home') },

  // ❌ Dynamic values are ignored during extraction
  // { path: someVariable, component: () => import(dynamicPath) },
])
```

## Route Definition Format

The config route format mirrors `RouteRecordRaw` but with the constraint that `component` must be a static import expression for the plugin to extract it:

```ts
interface RouteRecordRaw {
  path: string                    // required: route path, supports :params, (.*), ?
  name?: string                   // optional: route name (recommended for typed navigation)
  component?: Lazy<Component>     // required: lazy-loaded component via () => import()
  children?: RouteRecordRaw[]     // optional: nested child routes
  alias?: string | string[]       // optional: alternate paths
  redirect?: string | RouteLocationRaw  // optional: redirect target
  meta?: RouteMeta                // optional: arbitrary metadata
  props?: boolean | Record<string, any> | ((route: RouteLocationNormalized) => Record<string, any>)
  beforeEnter?: NavigationGuard | NavigationGuard[]
  sensitive?: boolean             // optional: case-sensitive matching
  strict?: boolean                // optional: trailing slash matching
}
```

## Generating `typed-router.d.ts` from Config Routes

When `mode: 'config'` is set with a `dts` option, the unplugin generates `typed-router.d.ts` from the config routes - the same output format as file-based routing:

```ts
// The plugin statically parses your config file,
// extracts route names, paths, and param definitions,
// and generates typed interfaces:

declare module 'essor-router' {
  interface RouteNamedMap {
    'home': RouteRecordInfo<'home', '/', Record<never, never>, Record<never, never>, RouteMeta>
    'about': RouteRecordInfo<'about', '/about', Record<never, never>, Record<never, never>, RouteMeta>
    'users-id': RouteRecordInfo<
      'users-id',
      '/users/:id',
      { id: string | number | null | undefined },
      { id: string },
      RouteMeta
    >
  }
}
```

This gives you full autocomplete and type checking for:

```ts
router.push({ name: '' })    // ← autocompletion of all config route names
router.push({ name: 'users-id', params: { id: '' } })  // ← typed params
```

## Shared Option Alignment

Config-based routing uses the same option defaults as file-based routing. Most options apply to both modes:

```tsx
essorRouter({
  mode: 'config',
  configRoutes: 'src/routes.config.ts',
  dts: 'typed-router.d.ts',          // works identically
  importMode: 'async',                // works identically
  extensions: ['.tsx', '.ts'],       // applies to component imports
  logs: true,                         // works identically
  watch: true,                        // watches configRoutes file for changes
})
```

The `routesFolder` option is **ignored** in `'config'` mode (the plugin does not scan the filesystem for route definitions).

## Full Example: Complete Route Config

```ts
// src/routes.config.ts
import { defineConfigRoutes } from 'essor-router-unplugin'

export default defineConfigRoutes([
  // Public routes
  {
    name: 'home',
    path: '/',
    component: () => import('./pages/Home'),
    meta: { title: 'Home', layout: 'default' },
  },
  {
    name: 'about',
    path: '/about',
    component: () => import('./pages/About'),
    meta: { title: 'About Us' },
  },

  // Auth routes
  {
    name: 'login',
    path: '/login',
    component: () => import('./pages/auth/Login'),
    meta: { title: 'Sign In', guestOnly: true },
  },
  {
    name: 'register',
    path: '/register',
    component: () => import('./pages/auth/Register'),
    meta: { title: 'Create Account', guestOnly: true },
  },

  // Products with nested routes
  {
    name: 'products',
    path: '/products',
    component: () => import('./pages/products/ProductsLayout'),
    meta: { title: 'Products', requiresAuth: false },
    children: [
      {
        name: 'products-list',
        path: '',
        component: () => import('./pages/products/ProductList'),
        meta: { title: 'All Products' },
      },
      {
        name: 'products-detail',
        path: ':id',
        component: () => import('./pages/products/ProductDetail'),
        meta: { title: 'Product Details' },
      },
      {
        name: 'products-edit',
        path: ':id/edit',
        component: () => import('./pages/products/ProductEdit'),
        meta: { title: 'Edit Product', requiresAuth: true, roles: ['admin', 'editor'] },
      },
    ],
  },

  // Admin section with nested layout
  {
    name: 'admin',
    path: '/admin',
    component: () => import('./pages/admin/AdminLayout'),
    meta: { requiresAuth: true, roles: ['admin'] },
    beforeEnter(to, from, next) {
      // Per-route guard (works the same as file-based)
      next()
    },
    children: [
      {
        name: 'admin-dashboard',
        path: '',
        component: () => import('./pages/admin/Dashboard'),
        meta: { title: 'Dashboard' },
      },
      {
        name: 'admin-users',
        path: 'users',
        component: () => import('./pages/admin/UserManagement'),
        meta: { title: 'User Management' },
      },
      {
        name: 'admin-users-detail',
        path: 'users/:id',
        component: () => import('./pages/admin/UserDetail'),
        meta: { title: 'User Details' },
      },
      {
        name: 'admin-settings',
        path: 'settings',
        component: () => import('./pages/admin/Settings'),
        meta: { title: 'Settings' },
      },
    ],
  },

  // Catch-all 404
  {
    name: 'not-found',
    path: '/:path(.*)*',
    component: () => import('./pages/errors/NotFound'),
    meta: { title: 'Page Not Found' },
  },
])
```

### Named Views in Config Routes

Config routes support named views using the `components` property:

```ts
defineConfigRoutes([
  {
    path: '/dashboard',
    components: {
      default: () => import('./pages/dashboard/Default'),
      sidebar: () => import('./pages/dashboard/Sidebar'),
      header: () => import('./pages/dashboard/Header'),
    },
  },
])
```

### Aliases and Redirects

```ts
defineConfigRoutes([
  {
    name: 'docs',
    path: '/documentation',
    component: () => import('./pages/Docs'),
    alias: ['/docs', '/help'],
  },
  {
    path: '/old-path',
    redirect: '/new-path',
  },
  {
    path: '/legacy/:id',
    redirect: (to) => {
      return { name: 'new-route', params: { legacyId: to.params.id } }
    },
  },
])
```

## Mixing Modes (Advanced)

You can run both modes simultaneously. When both `routesFolder` and `configRoutes` are provided, the plugin generates a combined route tree:

```tsx
// vite.config.ts
essorRouter({
  mode: 'file',                         // file-based is default
  routesFolder: 'src/pages',            // scans filesystem
  configRoutes: 'src/routes.config.ts', // also parse this config
  dts: 'typed-router.d.ts',            // types from both are merged
})
```

When a route is defined in both sources (same path/name), the **config-based definition takes precedence** for the name override. The component from the file-based route is still used unless explicitly overridden.

> [!WARNING]
> Mixing modes can lead to confusion about which source defines which route. Use only when you have a specific need (e.g., adding programmatic routes alongside file-based ones).

## Comparison: File-Based vs Config-Based

### File-Based Routing

```
src/pages/
├── index.tsx                  → /
├── about.tsx                  → /about
├── users/
│   ├── index.tsx              → /users
│   └── [id].tsx               → /users/:id
└── products/
    └── [id]+.tsx              → /products/:id+
```

```tsx
// vite.config.ts
essorRouter({ routesFolder: 'src/pages' })
```

### Config-Based Routing (Equivalent)

```ts
// src/routes.config.ts
defineConfigRoutes([
  { name: 'index',             path: '/',                component: () => import('./pages/index') },
  { name: 'about',             path: '/about',           component: () => import('./pages/about') },
  { name: 'users',             path: '/users',           component: () => import('./pages/users/index') },
  { name: 'users-id',          path: '/users/:id',       component: () => import('./pages/users/[id]') },
  { name: 'products-id',       path: '/products/:id+',   component: () => import('./pages/products/[id]+') },
])
```

```tsx
// vite.config.ts
essorRouter({ mode: 'config', configRoutes: 'src/routes.config.ts' })
```

## Troubleshooting

### "componentPath not extracted" or Missing Components

**Symptom**: Routes show in the generated output but components don't load.

**Cause**: The Babel static parser can only extract import paths from the `() => import('...')` pattern with a string literal argument.

**Fix**: Ensure every `component` is written as:
```ts
component: () => import('./pages/MyPage')
```

Do **not** use:
```ts
// ❌ Variable import path (not statically analyzable)
const page = './pages/MyPage'
component: () => import(page)

// ❌ Direct reference (bypasses lazy loading, path not extracted)
import MyPage from './pages/MyPage'
component: MyPage
```

### "configRoutes is required when mode is set to config"

**Symptom**: Build fails with this error.

**Cause**: `mode: 'config'` requires the `configRoutes` option to be set.

**Fix**:
```tsx
essorRouter({
  mode: 'config',
  configRoutes: 'src/routes.config.ts', // required
})
```

### HMR Not Triggering on Config File Changes

**Symptom**: Editing `routes.config.ts` doesn't update the route types.

**Cause**: The watcher may not be tracking the config file.

**Fix**:
1. Ensure `watch: true` is set (or is not explicitly `false`)
2. Restart the dev server
3. Check that the config file path exists and is reachable relative to `root`

### Route Name Autocomplete Not Working

**Symptom**: No autocomplete for `router.push({ name: '...' })`.

**Causes and fixes**:

| Cause | Fix |
|-------|-----|
| `dts` not set | Add `dts: 'typed-router.d.ts'` to options |
| `.d.ts` not generated | Restart dev server; check console for errors |
| Config file not parsed | Verify `export default defineConfigRoutes([...])` syntax |
| `routes` not imported from `essor-router/auto-routes` | Use `import { routes } from 'essor-router/auto-routes'` |
| Editor not picking up `.d.ts` | Restart TypeScript server in your editor |

### Dynamic Route Children Not Discovered

**Symptom**: Nested children defined in the config don't appear in the generated output.

**Cause**: The `children` array must be a static array literal containing static object literals.

**Fix**: Always write children as an inline array of objects:
```ts
// ✅ Works
defineConfigRoutes([{
  path: '/parent',
  children: [
    { path: 'child1', component: () => import('./Child1') },
  ],
}])

// ❌ Doesn't work
const kids = [{ path: 'child1', component: () => import('./Child1') }]
defineConfigRoutes([{ path: '/parent', children: kids }])
```

## Migration from File-Based to Config-Based

### Step 1: Export your current routes

First, inspect what file-based routing generated:

```ts
// Add this temporarily to see generated routes
import { routes } from 'essor-router/auto-routes'
console.log(routes)
```

### Step 2: Create the config file

Translate file paths to explicit route definitions:

```ts
// From file-based:
// src/pages/users/[id].tsx  → /users/:id

// To config-based:
{ name: 'users-id', path: '/users/:id', component: () => import('./pages/users/[id].tsx') }
```

### Step 3: Switch modes

```tsx
// vite.config.ts
essorRouter({
  mode: 'config',
  configRoutes: 'src/routes.config.ts',  // new config file
  dts: 'typed-router.d.ts',
})
```

### Step 4: Remove `routesFolder` (optional)

Once config-based routes are verified working, you can remove `routesFolder` or keep it for mixed-mode operation.
