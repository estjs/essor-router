# essor-router

The runtime router for [Essor](https://github.com/estjs/essor) — history, matcher, and router APIs.

[![npm](https://img.shields.io/npm/v/essor-router)](https://www.npmjs.com/package/essor-router)
[![license](https://img.shields.io/npm/l/essor-router)](https://github.com/estjs/essor-router/blob/main/LICENSE)

## Features

- **Type-safe Routing** — Strong TypeScript support for route parameters, queries, and locations
- **Flexible History Modes** — HTML5 History, Hash, and Memory modes
- **Nested Routes & Views** — Hierarchical layouts with nested `RouterView`
- **Navigation Guards** — `beforeEach`, `beforeResolve`, `afterEach`, `beforeEnter`, `onBeforeRouteLeave`, `onBeforeRouteUpdate`
- **Lazy Loading** — Async component loading with `() => import('./Page')`
- **Route Loaders** — Route data loaders for declarative data fetching
- **Scroll Behavior** — Customizable scroll behavior during navigation

## Installation

```bash
npm install essor-router
pnpm add essor-router
yarn add essor-router
```

## Quick Start

```tsx
import { createApp } from 'essor';
import { RouterLink, RouterView, createRouter, createWebHistory } from 'essor-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./Home') },
    { path: '/about', component: () => import('./About') },
  ],
});

function App() {
  return (
    <div>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
      <RouterView router={router} />
    </div>
  );
}

createApp(App, '#app');
```

## API Overview

### `createRouter(options)`

| Option | Type | Description |
|--------|------|-------------|
| `history` | `'history' \| 'hash' \| 'memory' \| RouterHistory` | History mode |
| `routes` | `RouteRecordRaw[]` | Route definitions (optional when `resolver` is supplied) |
| `resolver` | `FixedRouteResolver` | Prebuilt resolver from `unplugin-essor-router` |
| `base` | `string` | Base URL |
| `scrollBehavior` | `RouterScrollBehavior` | Scroll behavior callback |
| `parseQuery` | `(query: string) => LocationQuery` | Custom query parser |
| `stringifyQuery` | `(query: LocationQueryRaw) => string` | Custom query stringifier |
| `linkActiveClass` | `string` | Default active class |
| `linkExactActiveClass` | `string` | Default exact active class |

### History Modes

```tsx
import {
  createMemoryHistory,    // In-memory (SSR/testing)
  createWebHashHistory,   // Hash mode (#/)
  createWebHistory,       // HTML5 History API
} from 'essor-router';

const router = createRouter({ history: createWebHistory('/app/'), routes });
// or shorthand:
createRouter({ history: 'history', routes });
```

### Composition API

```tsx
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  const route = useRoute();

  // Reactive route access
  console.log(route.path, route.params, route.query, route.hash);

  // Navigation
  router.push('/about');
  router.push({ name: 'user', params: { id: '123' } });
  router.replace('/about');

  // Guards
  onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChanges()) next(false);
    else next();
  });

  onBeforeRouteUpdate((to, from, next) => {
    next();
  });
}
```

### Navigation Guards

```tsx
// Global
router.beforeEach((to, from, next) => { next(); });
router.beforeResolve((to, from, next) => { next(); });
router.afterEach((to, from, failure) => { /* analytics */ });

// Per-route
const routes = [{
  path: '/admin',
  beforeEnter: (to, from, next) => { next(); },
}];

// In-component (see Composition API above)
```

### Error Handling

```tsx
import { NavigationFailureType, isNavigationFailure } from 'essor-router';

router.onError((error) => console.error(error));

router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    // Navigation was cancelled by a guard
  }
});
```

### Prebuilt resolver (from `unplugin-essor-router`)

The unplugin emits an optimized `FixedRouteResolver` at build time. Pass it to
`createRouter` to skip the runtime matcher build:

```tsx
import { resolver } from 'virtual:essor-router/auto-resolver';
import { createRouter, createWebHistory } from 'essor-router';

const router = createRouter({
  history: createWebHistory(),
  resolver,
});
```

#### Path matching semantics

- `MatcherPatternPathStatic` matches **case-insensitively** and tolerates a
  trailing slash: `/About`, `/about`, and `/about/` all resolve to the same
  record.
- `MatcherPatternPathDynamic` first tries the raw regex, then retries with the
  trailing slash stripped.
- A failed `stringify()` (missing required param) throws
  `FixedResolverParamError` — distinct from `MatcherError`, which signals a
  failed *match*.

## Package Exports

| Export | Path |
|--------|------|
| Main | `essor-router` |
| Auto routes (virtual) | `essor-router/auto-routes` |
| Auto resolver (virtual) | `essor-router/auto-resolver` |
| Experimental (deprecated shim) | `essor-router/experimental` |

### Main exports

`createRouter`, `createWebHistory`, `createWebHashHistory`, `createMemoryHistory`, `RouterLink`, `RouterView`, `useRoute`, `useRouter`, `defineRoute`, `definePage`, `defineStartRoute`, `createFixedResolver`, `MatcherPatternPathStatic`, `MatcherPatternPathDynamic`, `MatcherPatternQueryParam`, `FixedResolverParamError`, `PARAM_PARSER_INT`, `PARAM_PARSER_BOOL`, `onBeforeRouteLeave`, `onBeforeRouteUpdate`, `isNavigationFailure`, `NavigationFailureType`, `parseQuery`, `stringifyQuery`

## Migrating from `0.0.17-beta.4` and earlier

The `essor-router/experimental` entry point has graduated to the main package
entry. The deprecated subpath still works for one release with a runtime
warning. Update imports as follows:

```diff
- import { createFixedResolver, definePage } from 'essor-router/experimental';
+ import { createFixedResolver, definePage } from 'essor-router';
```

Likewise, the `experimental` namespace on the unplugin options has been
flattened:

```diff
  vitePlugin({
-   experimental: {
-     paramParsers: true,
-     autoExportsDataLoaders: 'src/loaders/**/*',
-   },
+   paramParsers: true,
+   autoExportsDataLoaders: 'src/loaders/**/*',
  })
```

Old configs still load with a one-time deprecation warning.

## License

[MIT](../../LICENSE) © [estjs](https://github.com/estjs)
