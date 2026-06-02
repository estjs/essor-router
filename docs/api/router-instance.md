# Router Instance

The router instance returned by `createRouter()`.

## Properties

### currentRoute

- **Type:** `Signal<RouteLocationNormalizedLoaded>`

The current route location as a reactive Signal:

```tsx
const router = useRouter();

// Access current route
console.log(router.currentRoute.value.path);
console.log(router.currentRoute.value.params);
```

### options

- **Type:** `RouterOptions`

The original options passed to `createRouter()`:

```tsx
console.log(router.options.linkActiveClass);
```

### listening

- **Type:** `boolean`

Whether the router is listening to history changes:

```tsx
// Disable listening (useful for micro-frontends)
router.listening = false;
```

## Navigation Methods

### push

Navigate to a new location:

```tsx
// String path
router.push('/users');

// Object with path
router.push({ path: '/users' });

// Named route
router.push({ name: 'user', params: { id: '123' } });

// With query and hash
router.push({
  path: '/search',
  query: { q: 'essor' },
  hash: '#results',
});
```

**Returns:** `Promise<NavigationFailure | void | undefined>`

### replace

Replace current location (no history entry):

```tsx
router.replace('/users');
router.replace({ path: '/users' });
```

**Returns:** `Promise<NavigationFailure | void | undefined>`

### go

Navigate through history:

```tsx
router.go(1);   // Forward
router.go(-1);  // Back
router.go(-2);  // Back 2 entries
```

### back

Go back one entry (same as `go(-1)`):

```tsx
router.back();
```

### forward

Go forward one entry (same as `go(1)`):

```tsx
router.forward();
```

### preloadRoute

Eagerly resolve a target location and load its async components and route data hooks, without navigating. The returned promise resolves with the fully loaded route, so a later `push()`/`replace()` to the same location is instant.

```tsx
// Warm up the dashboard before the user clicks
await router.preloadRoute('/dashboard');
await router.preloadRoute({ name: 'user', params: { id: '123' } });
```

This is the imperative counterpart to `RouterLink`'s [`prefetch`](./router-link#prefetch) prop and the [`usePreloadRoute`](./composition-api#usepreloadroute) composable.

**Returns:** `Promise<RouteLocationNormalizedLoaded>`

## Route Management

### addRoute

Add a new route:

```tsx
// Add top-level route
router.addRoute({
  path: '/new',
  name: 'new',
  component: NewPage,
});

// Add child route
router.addRoute('parent-name', {
  path: 'child',
  component: ChildPage,
});
```

**Returns:** `() => void` - Function to remove the route

### removeRoute

Remove a route by name:

```tsx
router.removeRoute('route-name');
```

### hasRoute

Check if a route exists:

```tsx
if (router.hasRoute('admin')) {
  // Route exists
}
```

**Returns:** `boolean`

### getRoutes

Get all route records:

```tsx
const routes = router.getRoutes();
routes.forEach(route => {
  console.log(route.path, route.name);
});
```

**Returns:** `RouteRecord[]`

### clearRoutes

Remove every registered route at once:

```tsx
router.clearRoutes();
console.log(router.getRoutes().length); // 0
```

Useful when swapping an entire route set (e.g. micro-frontend hand-off). After clearing, register new routes with `addRoute()` before the next navigation.

**Returns:** `void`

### resolve

Resolve a route location:

```tsx
const resolved = router.resolve('/user/123');
const resolved = router.resolve({ name: 'user', params: { id: '123' } });

console.log(resolved.href);      // '/user/123'
console.log(resolved.fullPath);  // '/user/123'
console.log(resolved.params);    // { id: '123' }
```

**Returns:** `RouteLocation & { href: string }`

## Navigation Guards

### beforeEach

Add a global before guard:

```tsx
const unregister = router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/login');
  } else {
    next();
  }
});

// Remove the guard
unregister();
```

**Returns:** `() => void`

### beforeResolve

Add a global resolve guard:

```tsx
router.beforeResolve((to, from, next) => {
  // Called after in-component guards
  next();
});
```

**Returns:** `() => void`

### afterEach

Add a global after hook:

```tsx
router.afterEach((to, from, failure) => {
  // Called after navigation
  analytics.track(to.path);
});
```

**Returns:** `() => void`

## Error Handling

### onError

Add an error handler:

```tsx
router.onError((error, to, from) => {
  console.error('Router error:', error);
});
```

The handler receives the error plus the navigation it occurred on:

```tsx
type ErrorListener = (
  error: Error,
  to: RouteLocationNormalized,        // target being navigated to
  from: RouteLocationNormalizedLoaded, // location navigated away from
) => void;
```

Errors thrown inside guards, async components, or route data hooks are forwarded here. Navigation **failures** (aborted/cancelled/duplicated) are *not* errors — inspect the resolved value of `push()`/`replace()` with [`isNavigationFailure`](#isnavigationfailure) instead.

**Returns:** `() => void`

## Ready State

### isReady

Returns a Promise that resolves when the router is ready:

```tsx
await router.isReady();
console.log('Router is ready');
```

**Returns:** `Promise<void>`

## Lifecycle

### init

Initialize the router (called automatically by RouterView):

```tsx
router.init();
```

### destroy

Clean up the router:

```tsx
router.destroy();
```

## Prerender & Render Mode

These methods support static site generation and per-route rendering strategies driven by the `start` field on a route record (or via `defineStartRoute`).

### getPrerenderPaths

Returns prerender entries for routes marked with `start.prerender`:

```tsx
const entries = router.getPrerenderPaths();
```

Each entry is a `PrerenderPathInfo`:

```tsx
interface PrerenderPathInfo {
  name: string | symbol | undefined; // route name
  pathTemplate: string;              // e.g. '/users/:id'
  paths: string[];                   // concrete paths to render
  meta: Record<string | number | symbol, any>;
}
```

For static routes, `paths` contains the route path itself. For dynamic routes, provide concrete paths with `start.prerenderPaths`; otherwise the route is skipped.

```tsx
{
  path: '/users/:id',
  start: {
    prerender: true,
    prerenderPaths: ['/users/1', '/users/2'],
  },
}
```

**Returns:** `PrerenderPathInfo[]`

### getPrerenderPathsAsync

Same as `getPrerenderPaths`, but awaits any `start.prerenderPaths` that are async functions (e.g. fetching slugs from a CMS):

```tsx
{
  path: '/posts/:slug',
  start: {
    prerender: true,
    prerenderPaths: async () => {
      const posts = await fetchAllPosts();
      return posts.map(p => `/posts/${p.slug}`);
    },
  },
}

const entries = await router.getPrerenderPathsAsync();
```

**Returns:** `Promise<PrerenderPathInfo[]>`

### getRouteRenderMode

Returns the resolved render mode for a route by name:

```tsx
const mode = router.getRouteRenderMode('user'); // 'csr' | 'ssr' | 'prerender'
```

| Mode | Meaning |
|------|---------|
| `'csr'` | Client-side rendered (default) |
| `'ssr'` | Server-side rendered per request |
| `'prerender'` | Rendered to static HTML at build time |

The mode is derived from the route's `start` configuration. Routes with `start.prerender` resolve to `'prerender'`; use this in a build pipeline to decide how each route is emitted.

**Returns:** `RouteRenderMode`

## Navigation Failure

### isNavigationFailure

Check if a value is a navigation failure:

```tsx
import { NavigationFailureType, isNavigationFailure } from 'essor-router';

const result = await router.push('/path');

if (isNavigationFailure(result)) {
  console.log('Navigation failed');
}

if (isNavigationFailure(result, NavigationFailureType.aborted)) {
  console.log('Navigation was aborted');
}

if (isNavigationFailure(result, NavigationFailureType.cancelled)) {
  console.log('Navigation was cancelled');
}

if (isNavigationFailure(result, NavigationFailureType.duplicated)) {
  console.log('Already at this location');
}
```

### NavigationFailureType

```tsx
enum NavigationFailureType {
  aborted = 4,     // Guard returned false or called next(false)
  cancelled = 8,   // New navigation started before completion
  duplicated = 16, // Already at the target location
}
```

## Example

```tsx
import { createRouter, isNavigationFailure, NavigationFailureType } from 'essor-router';

const router = createRouter({
  history: 'history',
  routes: [...],
});

// Global guards
router.beforeEach((to, from, next) => {
  console.log(`Navigating from ${from.path} to ${to.path}`);
  next();
});

router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('Navigation failed:', failure);
  } else {
    document.title = to.meta.title || 'My App';
  }
});

// Error handling
router.onError((error) => {
  console.error('Router error:', error);
});

// Navigation
async function navigate() {
  const result = await router.push('/dashboard');
  
  if (isNavigationFailure(result, NavigationFailureType.aborted)) {
    console.log('Navigation was blocked by a guard');
  }
}

// Wait for ready
router.isReady().then(() => {
  console.log('Initial navigation complete');
});
```
