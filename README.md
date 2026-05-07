<h1 align="center">essor-router</h1>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/estjs/essor-router/ci.yml?label=CI&logo=GitHub" alt="CI">
  <img src="https://img.shields.io/github/license/estjs/essor-router" alt="license">
  <img src="https://img.shields.io/npm/v/essor-router" alt="version">
  <img src="https://img.shields.io/npm/dm/essor-router" alt="downloads">
  <img src="https://img.shields.io/codecov/c/github/estjs/essor-router" alt="coverage">
</p>

The official router for [Essor](https://github.com/estjs/essor) — a lightweight, type-safe routing solution.

## Table of Contents

- [Features](#features)
- [Packages](#packages)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [API Reference](#api-reference)
- [Examples](#examples)
- [TypeScript](#typescript)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🚀 **Multiple History Modes** — HTML5 History, Hash, and Memory modes
- 📁 **File-Based Routing** — Auto-generate routes from `src/pages/`
- ⚙️ **Config-Based Routing** — Explicit route config with full type inference
- 🎯 **Type-Safe** — Full TypeScript support with comprehensive type definitions
- 🔗 **Nested Routes** — Support for deeply nested route configurations
- 🛡️ **Navigation Guards** — Global, per-route, and in-component guards
- 📦 **Lazy Loading** — Async component loading with code splitting
- 🏷️ **Named Routes & Views** — Named routes and multiple named views
- 🔄 **Dynamic Routing** — Add/remove routes at runtime
- 📍 **Route Parameters** — Dynamic segments with custom regex patterns
- 🔀 **Redirects & Aliases** — Flexible route redirection and aliasing
- 🎨 **Route Meta** — Attach arbitrary data to routes
- 📜 **Scroll Behavior** — Customizable scroll behavior during navigation
- 🔍 **Query String** — Custom query parsing and stringifying
- ⚡ **HMR Support** — Live updates in development

## Packages

| Package | Description |
|---------|-------------|
| [`essor-router`](./packages/router) | Runtime router (history, matcher, router APIs) |
| [`unplugin-essor-router`](./packages/unplugin) | File-based routes, codegen, and typed routes |

## Quick Start

```bash
pnpm add essor-router
pnpm add -D unplugin-essor-router
```

```tsx
import { createApp } from 'essor';
import { RouterLink, RouterView, createRouter } from 'essor-router';

function Home() {
  return <div>Home Page</div>;
}

function About() {
  return <div>About Page</div>;
}

const router = createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
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

## Documentation

### Core Concepts

- [Getting Started](./docs/guide/getting-started.md)
- [Installation](./docs/guide/installation.md)
- [Route Configuration](./docs/guide/essentials/route-configuration.md)
- [Dynamic Matching](./docs/guide/essentials/dynamic-matching.md)
- [History Mode](./docs/guide/essentials/history-mode.md)
- [Named Routes](./docs/guide/essentials/named-routes.md)
- [Named Views](./docs/guide/essentials/named-views.md)
- [Nested Routes](./docs/guide/essentials/nested-routes.md)
- [Navigation](./docs/guide/essentials/navigation.md)
- [Redirect & Alias](./docs/guide/essentials/redirect-and-alias.md)
- [Passing Props](./docs/guide/essentials/passing-props.md)

### Advanced

- [Navigation Guards](./docs/guide/advanced/navigation-guards.md)
- [Composition API](./docs/guide/advanced/composition-api.md)
- [Lazy Loading](./docs/guide/advanced/lazy-loading.md)
- [Dynamic Routing](./docs/guide/advanced/dynamic-routing.md)
- [Route Meta](./docs/guide/advanced/meta.md)
- [Scroll Behavior](./docs/guide/advanced/scroll-behavior.md)
- [Query Handling](./docs/guide/advanced/query-handling.md)
- [Custom Param Parsers](./docs/guide/advanced/param-parsers.md)
- [Config-Based Routing](./docs/guide/advanced/config-based-routing.md)
- [File-Based Routing](./docs/guide/advanced/file-based-routing-unplugin.md)

### API

- [createRouter](./docs/api/create-router.md)
- [Router Instance](./docs/api/router-instance.md)
- [RouterLink](./docs/api/router-link.md)
- [RouterView](./docs/api/router-view.md)
- [Composition API](./docs/api/composition-api.md)
- [Config Alignment](./docs/api/config-alignment.md)
- [Unplugin](./docs/api/unplugin.md)
- [Types](./docs/api/types.md)

## API Reference

### `createRouter(options)`

Creates a router instance.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `history` | `'history' \| 'hash' \| 'memory' \| RouterHistory` | — | History mode |
| `routes` | `RouteRecordRaw[]` | `[]` | Initial route records |
| `base` | `string` | `'/'` | Base URL path |
| `scrollBehavior` | `RouterScrollBehavior` | — | Custom scroll behavior |
| `parseQuery` | `(query: string) => LocationQuery` | built-in | Custom query parser |
| `stringifyQuery` | `(query: LocationQueryRaw) => string` | built-in | Custom query stringifier |
| `linkActiveClass` | `string` | `'router-link-active'` | Default active class for RouterLink |
| `linkExactActiveClass` | `string` | `'router-link-exact-active'` | Default exact active class for RouterLink |

### Router Instance

| Property/Method | Description |
|-----------------|-------------|
| `currentRoute` | Current route location (reactive signal) |
| `push(to)` | Navigate to a new location |
| `replace(to)` | Replace current location |
| `go(delta)` | Navigate in history by delta |
| `back()` | Go back in history |
| `forward()` | Go forward in history |
| `resolve(to)` | Resolve a raw location |
| `addRoute(route)` | Add a route dynamically |
| `removeRoute(name)` | Remove a route by name |
| `hasRoute(name)` | Check if route exists |
| `getRoutes()` | Get all route records |
| `clearRoutes()` | Remove all routes |
| `beforeEach(guard)` | Add global before guard |
| `beforeResolve(guard)` | Add global resolve guard |
| `afterEach(hook)` | Add global after hook |
| `onError(handler)` | Add error handler |
| `isReady()` | Promise that resolves when router is ready |
| `init()` | Initialize the router |
| `destroy()` | Destroy the router |
| `preloadRoute(to)` | Preload a route's async components |

### Components

| Component | Description |
|-----------|-------------|
| `<RouterView>` | Renders the matched component for the current route |
| `<RouterLink>` | Creates a link for declarative navigation |

### Composition Functions

| Function | Description |
|----------|-------------|
| `useRouter()` | Returns the router instance |
| `useRoute()` | Returns the current route |
| `onBeforeRouteLeave(guard)` | Register in-component leave guard |
| `onBeforeRouteUpdate(guard)` | Register in-component update guard |

### Navigation Guards

```tsx
// Global guards
// In-component guards
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'essor-router';

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});

router.beforeResolve((to, from, next) => { next(); });
router.afterEach((to, from, failure) => {
  if (!failure) analytics.track(to.path);
});

// Per-route guard
const routes = [{
  path: '/admin',
  component: Admin,
  beforeEnter: (to, from, next) => {
    if (!isAdmin()) next('/forbidden');
    else next();
  },
}];

function Editor() {
  onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChanges() && !confirm('Discard changes?')) {
      next(false);
    } else {
      next();
    }
  });
  return <div>Editor</div>;
}
```

### Error Handling

```tsx
import { NavigationFailureType, isNavigationFailure } from 'essor-router';

router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    console.log('Navigation was aborted');
  }
  if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    console.log('Already at this location');
  }
});

router.onError((error, to, from) => {
  console.error('Router error:', error);
});
```

## Examples

| Example | Description |
|---------|-------------|
| [basic](./examples/basic) | Simple routing setup with RouterLink |
| [file-routes](./examples/file-routes) | File-based routing with named views and layouts |
| [typed-router](./examples/typed-router) | Type-safe routing with auto-generated types |
| [config-router](./examples/config-router) | Config-based route definitions |
| [option-router](./examples/option-router) | Programmatic navigation with useRouter |
| [router-link](./examples/router-link) | RouterLink with memory history |
| [use-api](./examples/use-api) | Composition API usage |
| [async-router](./examples/async-router) | Lazy loading routes with hash history |
| [param-parsers](./examples/param-parsers) | Custom route param parsers |
| [data-loaders](./examples/data-loaders) | Route data loaders |
| [guards](./examples/guards) | Comprehensive navigation guards |

## TypeScript

essor-router is written in TypeScript and provides full type support. Extend the `RouteMeta` interface for custom meta fields:

```typescript
// types.d.ts
import 'essor-router';

declare module 'essor-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
    title?: string;
  }
}
```

For file-based routing, install the TypeScript plugin for IDE autocompletion:



## Browser Support

Supports all modern browsers. For HTML5 History mode, ensure your server handles client-side routing with a catch-all fallback to `index.html`.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

[MIT](./LICENSE) © [estjs](https://github.com/estjs)
