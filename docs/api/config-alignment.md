# Configuration Alignment Guide

> Covers `essor-router-unplugin` (build plugin) and `essor-router-ts-plugin` (TypeScript language service plugin).

---

## Two Modes for Route Type Generation

`essor-router-unplugin` is the single source of typed route generation. It supports two input modes, which can be used simultaneously.

### Mode 1: File-based Routes (Auto-scan)

unplugin scans the `routesFolder` directory and automatically generates `typed-router.d.ts`:

```ts
// vite.config.ts
routerPlugin({
  routesFolder: 'src/pages',      // directory to scan
  dts: 'typed-router.d.ts',       // type output file
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
  configRoutes: 'src/routes.config.ts',  // config-based routes file
  dts: 'typed-router.d.ts',
})
```

### Mixed Mode (Both Active)

```ts
routerPlugin({
  routesFolder: 'src/pages',             // file-based routes
  configRoutes: 'src/routes.config.ts',  // config-based routes
  dts: 'typed-router.d.ts',             // types from both are merged
})
```

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

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| No route name autocomplete | `dts` ≠ `typedRouterDts` or `.d.ts` not generated | Align both paths; verify unplugin ran |
| Editor shows stale route names | `routesFolder` mismatch | Align both `routesFolder` values |
| Config-based types not updating | `configRoutes` file changed but HMR not triggered | Restart dev server or verify watch mode is on |
| `useRoute<'name'>()` can't find route | `moduleName` doesn't match actual import | Update `moduleName` to match your package alias |
