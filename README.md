<h1 align="center">essor-router</h1>

<div align="center">

![ci](https://img.shields.io/github/actions/workflow/status/estjs/essor-router/ci.yml?label=CI&logo=GitHub)
![license](https://img.shields.io/github/license/estjs/essor-router)
![version](https://img.shields.io/npm/v/essor-router)
![download](https://img.shields.io/npm/dm/essor-router)
![codecov](https://img.shields.io/codecov/c/github/estjs/essor-router)

</div>

The official router for [Essor](https://github.com/estjs/essor) - A lightweight, type-safe routing solution.

## Features

- 🚀 **Multiple History Modes** - HTML5 History, Hash, and Memory modes
- 🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🔗 **Nested Routes** - Support for deeply nested route configurations
- 🛡️ **Navigation Guards** - Global, per-route, and in-component guards
- 📦 **Lazy Loading** - Async component loading with code splitting
- 🏷️ **Named Routes & Views** - Named routes and multiple named views
- 🔄 **Dynamic Routing** - Add/remove routes at runtime
- 📍 **Route Parameters** - Dynamic segments with custom regex patterns
- 🔀 **Redirects & Aliases** - Flexible route redirection and aliasing

## Installation

```bash
# npm
npm install essor-router

# pnpm
pnpm add essor-router

# yarn
yarn add essor-router
```

## Quick Start

```tsx
import { createApp } from 'essor';
import { RouterLink, RouterView, createRouter } from 'essor-router';

// Define components
function Home() {
  return <div>Home Page</div>;
}

function About() {
  return <div>About Page</div>;
}

// Create router instance
const router = createRouter({
  history: 'history', // 'history' | 'hash' | 'memory'
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ],
});

// Create app with RouterView
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

For detailed documentation, please visit the [docs](./docs) folder or check out the examples below.

### Core Concepts

- [Router Configuration](#router-configuration)
- [Route Matching](#route-matching)
- [Navigation](#navigation)
- [Navigation Guards](#navigation-guards)
- [Composition API](#composition-api)

### Router Configuration

```tsx
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'essor-router';

const router = createRouter({
  // History mode - choose one:
  history: 'history',           // HTML5 History API (recommended)
  // history: 'hash',           // Hash mode for static hosting
  // history: 'memory',         // Memory mode for SSR/testing
  
  // Or use factory functions for more control:
  // history: createWebHistory('/base-path/'),
  // history: createWebHashHistory(),
  // history: createMemoryHistory(),
  
  routes: [
    // Basic route
    { path: '/', component: Home },
    
    // Named route
    { path: '/user/:id', name: 'user', component: User },
    
    // Nested routes
    {
      path: '/dashboard',
      component: Dashboard,
      children: [
        { path: '', component: DashboardHome },
        { path: 'settings', component: DashboardSettings },
      ],
    },
    
    // Redirect
    { path: '/home', redirect: '/' },
    
    // Alias
    { path: '/users', component: Users, alias: '/people' },
    
    // Catch-all 404
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
});
```

### Route Matching

essor-router supports powerful path matching with dynamic segments:

```tsx
const routes = [
  // Dynamic segment
  { path: '/user/:id', component: User },
  
  // Multiple segments
  { path: '/user/:userId/post/:postId', component: Post },
  
  // Optional segment
  { path: '/user/:id?', component: User },
  
  // Repeatable segment
  { path: '/files/:path+', component: Files },
  
  // Optional repeatable
  { path: '/files/:path*', component: Files },
  
  // Custom regex
  { path: '/user/:id(\\d+)', component: User },
  
  // Catch-all
  { path: '/:pathMatch(.*)*', component: NotFound },
];
```

### Navigation

#### Declarative Navigation

```tsx
import { RouterLink } from 'essor-router';

// String path
<RouterLink to="/about">About</RouterLink>

// Object with path
<RouterLink to={{ path: '/user/123' }}>User</RouterLink>

// Named route with params
<RouterLink to={{ name: 'user', params: { id: '123' } }}>User</RouterLink>

// With query and hash
<RouterLink to={{ path: '/search', query: { q: 'essor' }, hash: '#results' }}>
  Search
</RouterLink>

// Replace instead of push
<RouterLink to="/about" replace>About</RouterLink>

// Active class customization
<RouterLink to="/about" activeClass="active" exactActiveClass="exact-active">
  About
</RouterLink>
```

#### Programmatic Navigation

```tsx
import { useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  
  // Navigate to path
  router.push('/about');
  
  // Navigate with object
  router.push({ path: '/user/123' });
  
  // Named route
  router.push({ name: 'user', params: { id: '123' } });
  
  // With query
  router.push({ path: '/search', query: { q: 'essor' } });
  
  // Replace current entry
  router.replace('/about');
  
  // Go back/forward
  router.back();
  router.forward();
  router.go(-2);
}
```

### Navigation Guards

#### Global Guards

```tsx
// Before each navigation
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});

// Before resolve (after in-component guards)
router.beforeResolve((to, from, next) => {
  next();
});

// After each navigation
router.afterEach((to, from, failure) => {
  if (!failure) {
    analytics.track(to.path);
  }
});
```

#### Per-Route Guards

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      if (!isAdmin()) {
        next('/forbidden');
      } else {
        next();
      }
    },
  },
];
```

#### In-Component Guards

```tsx
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'essor-router';

function Editor() {
  onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChanges()) {
      if (confirm('Discard changes?')) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });
  
  onBeforeRouteUpdate((to, from, next) => {
    // Called when route params change but component is reused
    next();
  });
  
  return <div>Editor</div>;
}
```

### Composition API

```tsx
import { useRoute, useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  const route = useRoute();
  
  // Access current route info
  console.log(route.path);        // '/user/123'
  console.log(route.params);      // { id: '123' }
  console.log(route.query);       // { tab: 'profile' }
  console.log(route.hash);        // '#section'
  console.log(route.fullPath);    // '/user/123?tab=profile#section'
  console.log(route.name);        // 'user'
  console.log(route.meta);        // { requiresAuth: true }
  console.log(route.matched);     // Array of matched route records
  
  // Router instance methods
  router.push('/new-path');
  router.replace('/new-path');
  router.back();
  router.forward();
  router.go(n);
  
  // Dynamic route management
  router.addRoute({ path: '/new', component: NewPage });
  router.removeRoute('routeName');
  router.hasRoute('routeName');
  router.getRoutes();
  
  return <div>Current path: {route.path}</div>;
}
```

### Route Meta

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      roles: ['admin'],
    },
  },
];

// Access in guards
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // Check authentication
  }
  next();
});

// Access in components
function Admin() {
  const route = useRoute();
  console.log(route.meta.roles); // ['admin']
}
```

### Named Views

```tsx
const routes = [
  {
    path: '/dashboard',
    components: {
      default: DashboardMain,
      sidebar: DashboardSidebar,
      header: DashboardHeader,
    },
  },
];

function Layout() {
  return (
    <div>
      <RouterView name="header" />
      <div class="content">
        <RouterView name="sidebar" />
        <RouterView /> {/* default */}
      </div>
    </div>
  );
}
```

### Lazy Loading

```tsx
const routes = [
  {
    path: '/about',
    component: () => import('./pages/About'),
  },
];
```

### Error Handling

```tsx
import { NavigationFailureType, isNavigationFailure } from 'essor-router';

router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('Navigation failed:', failure);
  }
  
  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    console.log('Navigation was aborted');
  }
  
  if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    console.log('Already at this location');
  }
});

// Global error handler
router.onError((error, to, from) => {
  console.error('Router error:', error);
});
```

## API Reference

### createRouter(options)

Creates a router instance.

| Option | Type | Description |
|--------|------|-------------|
| `history` | `'history' \| 'hash' \| 'memory' \| RouterHistory` | History mode |
| `routes` | `RouteRecordRaw[]` | Initial route records |
| `base` | `string` | Base URL path |
| `parseQuery` | `(query: string) => LocationQuery` | Custom query parser |
| `stringifyQuery` | `(query: LocationQueryRaw) => string` | Custom query stringifier |
| `linkActiveClass` | `string` | Default active class for RouterLink |
| `linkExactActiveClass` | `string` | Default exact active class for RouterLink |

### Router Instance

| Property/Method | Description |
|-----------------|-------------|
| `currentRoute` | Current route location (Signal) |
| `options` | Router options |
| `push(to)` | Navigate to a new location |
| `replace(to)` | Replace current location |
| `back()` | Go back in history |
| `forward()` | Go forward in history |
| `go(delta)` | Go to specific history position |
| `beforeEach(guard)` | Add global before guard |
| `beforeResolve(guard)` | Add global resolve guard |
| `afterEach(hook)` | Add global after hook |
| `onError(handler)` | Add error handler |
| `addRoute(route)` | Add a route dynamically |
| `removeRoute(name)` | Remove a route by name |
| `hasRoute(name)` | Check if route exists |
| `getRoutes()` | Get all route records |
| `resolve(to)` | Resolve a route location |
| `isReady()` | Promise that resolves when router is ready |

### Components

#### RouterView

Renders the matched component for the current route.

```tsx
<RouterView 
  router={router}      // Router instance (optional if provided via context)
  name="default"       // Named view (default: 'default')
  route={route}        // Override route to display
/>
```

#### RouterLink

Creates a link for navigation.

```tsx
<RouterLink
  to="/path"                    // Target location
  replace={false}               // Use replace instead of push
  activeClass="active"          // Class when active
  exactActiveClass="exact"      // Class when exactly active
  custom={false}                // Disable default anchor rendering
/>
```

### Composition Functions

| Function | Description |
|----------|-------------|
| `useRouter()` | Returns the router instance |
| `useRoute()` | Returns the current route |
| `onBeforeRouteLeave(guard)` | Register leave guard |
| `onBeforeRouteUpdate(guard)` | Register update guard |

## Examples

Check out the [examples](./examples) directory for more usage examples:

- [Basic](./examples/basic) - Simple routing setup
- [Use API](./examples/use-api) - Using composition API
- [Router Link](./examples/router-link) - RouterLink usage
- [Async Router](./examples/async-router) - Lazy loading routes
- [Option Router](./examples/option-router) - Advanced configuration

## TypeScript

essor-router is written in TypeScript and provides full type support. You can extend the `RouteMeta` interface to add custom meta fields:

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

## Browser Support

essor-router supports all modern browsers. For HTML5 History mode, ensure your server is configured to handle client-side routing.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting a PR.

## License

[MIT](./LICENSE) License © 2024-present [estjs](https://github.com/estjs)
