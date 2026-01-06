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
