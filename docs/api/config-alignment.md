# Configuration Alignment Guide

> Covers `essor-router-unplugin` (build plugin) and `essor-router-ts-plugin` (TypeScript language service plugin).

---

## Two Modes for Route Type Generation

`essor-router-unplugin` is the single source of typed route generation. It supports two input modes controlled by the `mode` option.

### The `mode` Option

```ts
routerPlugin({
  mode: 'file' | 'config'
})
```

| `mode` | Behavior | Required Option |
|--------|----------|----------------|
| `'file'` (default) | Scans `routesFolder` directories for page files. Generates routes from file paths and `defineRoute()` calls. | `routesFolder` |
| `'config'` | Parses a config file with `defineConfigRoutes([...])`. Generates routes from the static route array. Does not scan the filesystem. | `configRoutes` |

When both `routesFolder` and `configRoutes` are provided (mixed mode), the plugin generates a merged route tree. You can set `mode: 'file'` or simply omit `mode` — the default is `'file'`.

### Mode 1: File-based Routes (Auto-scan)

unplugin scans the `routesFolder` directory and automatically generates `typed-router.d.ts`:

```ts
// vite.config.ts
routerPlugin({
  mode: 'file',                     // explicit; also the default
  routesFolder: 'src/pages',        // directory to scan
  dts: 'typed-router.d.ts',         // type output file
})
```

If you omit `mode`, it defaults to `'file'`:

```ts
routerPlugin({
  routesFolder: 'src/pages',
  dts: 'typed-router.d.ts',
})
```

### Mode 2: Config-based Routes

Declare routes in a separate config file. unplugin statically analyzes it and generates the same `typed-router.d.ts`:

```ts
// src/routes.config.ts
import { defineConfigRoutes } from 'essor-router-unplugin'

export default defineConfigRoutes([
  { name: 'home',     path: '/',           component: () => import('./pages/Home.tsx') },
  { name: 'users-id', path: '/users/:id', component: () => import('./pages/UserDetail.tsx') },
])
```

```ts
// vite.config.ts
routerPlugin({
  mode: 'config',                        // required: set to 'config'
  configRoutes: 'src/routes.config.ts',   // required: path to config file
  dts: 'typed-router.d.ts',
})
```

> [!WARNING]
> Setting `mode: 'config'` without `configRoutes` throws: `[essor-router] 'configRoutes' is required when 'mode' is set to "config".`

### Mixed Mode (Both Active)

```ts
routerPlugin({
  mode: 'file',                          // file-based is the default
  routesFolder: 'src/pages',             // file-based routes
  configRoutes: 'src/routes.config.ts',  // config-based routes
  dts: 'typed-router.d.ts',             // types from both are merged
})
```

When both sources are active, routes from both are combined into a single tree. If a route is defined in both sources (same path or name), the config-based definition takes precedence for the name, while the file-based component path is preserved unless explicitly overridden.

---

## Shared Option Alignment

All shared defaults are pre-aligned. A typical project needs **zero extra configuration**:

```ts
// vite.config.ts — uses defaults
routerPlugin()
```

```json
// tsconfig.json — uses defaults
{ "compilerOptions": { "plugins": [{ "name": "essor-router-ts-plugin" }] } }
```

| What | unplugin option | ts-plugin option | Default |
|------|----------------|-----------------|---------|
| Routes directory | `routesFolder` | `routesFolder` | `'src/pages'` |
| Typed routes file | `dts` | `typedRouterDts` | `'typed-router.d.ts'` |
| Router package name | *(not applicable)* | `moduleName` | `'essor-router'` |

---

## When You Deviate from Defaults

### Custom `routesFolder`

```ts
// vite.config.ts
routerPlugin({ routesFolder: 'src/app/routes' })
```

```json
// tsconfig.json — must match
{ "plugins": [{ "name": "essor-router-ts-plugin", "routesFolder": "src/app/routes" }] }
```

### Custom `dts` output path

```ts
// vite.config.ts
routerPlugin({ dts: 'src/types/typed-router.d.ts' })
```

```json
// tsconfig.json — must match
{ "plugins": [{ "name": "essor-router-ts-plugin", "typedRouterDts": "src/types/typed-router.d.ts" }] }
```

> [!WARNING]
> Mismatching `dts` and `typedRouterDts` is the most common cause of route name type completions disappearing in the editor.

---

## Feature Comparison

| Feature | File-based | Config-based |
|---------|-----------|-------------|
| `RouteNamedMap` auto-generation | ✅ | ✅ |
| `router.push({ name })` type checking | ✅ | ✅ |
| Path params type inference | ✅ | ✅ |
| `useRoute()` per-file narrowing (ts-plugin) | ✅ | ⚠️ (requires component paths) |
| `RouteTreeMap` (search/loader type inference) | ✅ | ⚠️ (requires `defineRoute`) |

---

## Complete Example: File vs Config Side by Side

Below is the same application defined in both modes. Both produce identical `typed-router.d.ts`, virtual modules, and runtime behavior.

### File-Based (`mode: 'file'`)

**Directory structure:**
```
src/pages/
├── index.tsx                  → /
├── about.tsx                  → /about
├── login.tsx                  → /login
├── users/
│   ├── index.tsx              → /users
│   └── [id].tsx               → /users/:id
└── admin/
    ├── index.tsx              → /admin
    ├── users.tsx              → /admin/users
    └── settings.tsx           → /admin/settings
```

**Plugin config:**
```ts
// vite.config.ts
import essorRouter from 'essor-router-unplugin/vite'

export default {
  plugins: [
    essorRouter({
      mode: 'file',
      routesFolder: 'src/pages',
      dts: 'typed-router.d.ts',
    }),
  ],
}
```

### Config-Based (`mode: 'config'`)

**Single config file:**
```ts
// src/routes.config.ts
import { defineConfigRoutes } from 'essor-router-unplugin'

export default defineConfigRoutes([
  { name: 'index',              path: '/',               component: () => import('./pages/index') },
  { name: 'about',              path: '/about',          component: () => import('./pages/about') },
  { name: 'login',              path: '/login',          component: () => import('./pages/login') },
  { name: 'users',              path: '/users',          component: () => import('./pages/users/index') },
  { name: 'users-id',           path: '/users/:id',      component: () => import('./pages/users/[id]') },
  { name: 'admin',              path: '/admin',          component: () => import('./pages/admin/index') },
  { name: 'admin-users',        path: '/admin/users',    component: () => import('./pages/admin/users') },
  { name: 'admin-settings',     path: '/admin/settings', component: () => import('./pages/admin/settings') },
])
```

**Plugin config:**
```ts
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

### Both Produce Identical Usage

Regardless of mode, your router setup and component code are the same:

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

```tsx
// In any component:
import { useRouter } from 'essor-router'

const router = useRouter()
router.push({ name: 'users-id', params: { id: '42' } })
//                 ^ autocompleted from typed-router.d.ts in both modes
```

---

## Migration Guide: Switching Between Modes

### File-Based → Config-Based

1. **Export your current routes** to see what's been generated:
   ```ts
   import { routes } from 'essor-router/auto-routes'
   console.log(JSON.stringify(routes, null, 2))
   ```

2. **Create `src/routes.config.ts`** mapping each file to an explicit entry:
   ```
   src/pages/users/[id].tsx → { name: 'users-id', path: '/users/:id', component: () => import('./pages/users/[id]') }
   ```

3. **Update plugin config:**
   ```ts
   // Before
   essorRouter({ routesFolder: 'src/pages' })
   // After
   essorRouter({ mode: 'config', configRoutes: 'src/routes.config.ts' })
   ```

4. **Remove or keep `routesFolder`.** Keeping it enables mixed mode if needed.

5. **Verify:** run `pnpm run typecheck` and check that route name autocomplete works in your editor.

### Config-Based → File-Based

1. **Create the directory structure** matching your routes:
   ```
   /       → src/pages/index.tsx
   /about  → src/pages/about.tsx
   /users/:id → src/pages/users/[id].tsx
   ```

2. **Update plugin config:**
   ```ts
   // Before
   essorRouter({ mode: 'config', configRoutes: 'src/routes.config.ts' })
   // After
   essorRouter({ routesFolder: 'src/pages' })
   ```

3. **Export route definitions from each page file** if you use `defineRoute()`:
   ```tsx
   // src/pages/users/[id].tsx
   import { defineRoute } from 'essor-router/experimental'
   export const route = defineRoute({ name: 'users-id' })
   ```

4. **Keep the config file** during migration for mixed-mode operation, then remove once file-based routes are stable.

5. **Verify:** run `pnpm run dev` and check that all routes resolve correctly.

### Mixed Mode → Single Mode

If you're currently running mixed mode and want to consolidate:

1. **List all routes** from both sources
2. **Identify duplicates** — routes with the same name or path from both sources
3. **Choose the canonical source** for each route
4. **Remove entries** from the source you're phasing out
5. **Remove the option** for the source you've eliminated (`routesFolder` or `configRoutes`)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| No route name autocomplete | `dts` ≠ `typedRouterDts` or `.d.ts` not generated | Align both paths; verify unplugin ran |
| Editor shows stale route names | `routesFolder` mismatch | Align both `routesFolder` values |
| Config-based types not updating | `configRoutes` file changed but HMR not triggered | Restart dev server or verify watch mode is on |
| `useRoute<'name'>()` can't find route | `moduleName` doesn't match actual import | Update `moduleName` to match your package alias |
| Build fails: "configRoutes is required" | `mode: 'config'` set without `configRoutes` | Add `configRoutes: 'src/routes.config.ts'` or remove `mode` |
| Config routes silently ignored | Missing `export default` in config file | Ensure `export default defineConfigRoutes([...])` |
| Dynamic import paths not extracted | `component` uses variable or non-literal path | Use string literal: `() => import('./pages/Foo')` |
