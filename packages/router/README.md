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
- **Route Loaders** — Experimental route data loaders for declarative data fetching
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
| `routes` | `RouteRecordRaw[]` | Route definitions |
| `base` | `string` | Base URL |
| `scrollBehavior` | `RouterScrollBehavior` | Scroll behavior callback |
| `parseQuery` | `(query: string) => LocationQuery` | Custom query parser |
| `stringifyQuery` | `(query: LocationQueryRaw) => string` | Custom query stringifier |
| `linkActiveClass` | `string` | Default active class |
| `linkExactActiveClass` | `string` | Default exact active class |

### History Modes

```tsx
import {
  createWebHistory,      // HTML5 History API
  createWebHashHistory,   // Hash mode (#/)
  createMemoryHistory,    // In-memory (SSR/testing)
} from 'essor-router';

const router = createRouter({ history: createWebHistory('/app/'), routes });
// or shorthand:
const router = createRouter({ history: 'history', routes });
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

## TypeScript Integration

For IDE autocompletion with file-based routes, install:

```bash
pnpm add -D essor-router-ts-plugin
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [{
      "name": "essor-router-ts-plugin",
      "routesFolder": "src/pages",
      "typedRouterDts": "typed-router.d.ts"
    }]
  }
}
```

## Package Exports

| Export | Path |
|--------|------|
| Main | `essor-router` |
| Experimental | `essor-router/experimental` |

### Main exports

`createRouter`, `createWebHistory`, `createWebHashHistory`, `createMemoryHistory`, `RouterLink`, `RouterView`, `useRoute`, `useRouter`, `onBeforeRouteLeave`, `onBeforeRouteUpdate`, `isNavigationFailure`, `NavigationFailureType`, `parseQuery`, `stringifyQuery`

### Experimental exports

`defineRoute`, `definePage`, `_mergeRouteRecord`, `createFixedResolver`, `MatcherPatternPathStatic`, `MatcherPatternPathDynamic`, `MatcherPatternQueryParam`, `normalizeRouteRecord`, `PARAM_PARSER_INT`, `PARAM_PARSER_BOOL`

## License

[MIT](../../LICENSE) © [estjs](https://github.com/estjs)
