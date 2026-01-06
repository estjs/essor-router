# Composition API

essor-router provides composition functions for accessing router functionality in components.

## useRouter

Returns the router instance.

### Signature

```tsx
function useRouter(): Router
```

### Usage

```tsx
import { useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  
  const navigate = () => {
    router.push('/about');
  };
  
  return <button onClick={navigate}>Go to About</button>;
}
```

### Returns

The `Router` instance with all its methods and properties:

- `currentRoute` - Current route (Signal)
- `options` - Router options
- `push()` - Navigate to location
- `replace()` - Replace current location
- `back()` - Go back
- `forward()` - Go forward
- `go()` - Go to history position
- `beforeEach()` - Add before guard
- `afterEach()` - Add after hook
- `addRoute()` - Add route
- `removeRoute()` - Remove route
- `hasRoute()` - Check route exists
- `getRoutes()` - Get all routes
- `resolve()` - Resolve route location

---

## useRoute

Returns the current route location.

### Signature

```tsx
function useRoute(): RouteLocationNormalizedLoaded
```

### Usage

```tsx
import { useRoute } from 'essor-router';

function MyComponent() {
  const route = useRoute();
  
  return (
    <div>
      <p>Path: {route.path}</p>
      <p>Params: {JSON.stringify(route.params)}</p>
      <p>Query: {JSON.stringify(route.query)}</p>
    </div>
  );
}
```

### Returns

The current route location object:

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | URL path |
| `fullPath` | `string` | Full URL including query and hash |
| `name` | `string \| undefined` | Route name |
| `params` | `Record<string, string>` | Route parameters |
| `query` | `Record<string, string>` | Query parameters |
| `hash` | `string` | URL hash |
| `meta` | `RouteMeta` | Route meta fields |
| `matched` | `RouteRecordNormalized[]` | Matched route records |
| `redirectedFrom` | `RouteLocation \| undefined` | Original route if redirected |
| `href` | `string` | Resolved href |

---

## onBeforeRouteLeave

Registers a navigation guard for when leaving the current route.

### Signature

```tsx
function onBeforeRouteLeave(guard: NavigationGuard): void
```

### Usage

```tsx
import { onBeforeRouteLeave } from 'essor-router';

function Editor() {
  const hasUnsavedChanges = signal(false);
  
  onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChanges.value) {
      const confirmed = confirm('Discard unsaved changes?');
      if (confirmed) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });
  
  return <div>Editor</div>;
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `guard` | `NavigationGuard` | Guard function |

### Guard Function

```tsx
type NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => void | Promise<void>
```

### next() Options

```tsx
next();           // Proceed
next(false);      // Cancel navigation
next('/path');    // Redirect to path
next({ name: 'route' }); // Redirect to named route
next(new Error('message')); // Abort with error
```

---

## onBeforeRouteUpdate

Registers a navigation guard for when the route changes but the component is reused.

### Signature

```tsx
function onBeforeRouteUpdate(guard: NavigationGuard): void
```

### Usage

```tsx
import { onBeforeRouteUpdate, useRoute } from 'essor-router';

function UserProfile() {
  const route = useRoute();
  const user = signal(null);
  
  // Initial load
  fetchUser(route.params.id).then(data => {
    user.value = data;
  });
  
  // React to param changes
  onBeforeRouteUpdate(async (to, from, next) => {
    if (to.params.id !== from.params.id) {
      user.value = await fetchUser(to.params.id);
    }
    next();
  });
  
  return <div>User: {user.value?.name}</div>;
}
```

### When It's Called

This guard is called when:
- The route path changes but matches the same component
- Route params change (e.g., `/user/1` to `/user/2`)
- Query or hash changes

---

## loadRouteLocation

Ensures a route's async components are loaded.

### Signature

```tsx
function loadRouteLocation(
  route: RouteLocationNormalized
): Promise<RouteLocationNormalizedLoaded>
```

### Usage

```tsx
import { loadRouteLocation } from 'essor-router';

function PreloadLink({ to, children }) {
  const router = useRouter();
  
  const preload = async () => {
    const route = router.resolve(to);
    await loadRouteLocation(route);
  };
  
  return (
    <RouterLink to={to} onMouseEnter={preload}>
      {children}
    </RouterLink>
  );
}
```

---

## Example: Complete Component

```tsx
import { 
  onBeforeRouteLeave, 
  onBeforeRouteUpdate, 
  useRoute, 
  useRouter 
} from 'essor-router';

function UserEditor() {
  const router = useRouter();
  const route = useRoute();
  
  const userId = route.params.id;
  const user = signal(null);
  const isDirty = signal(false);
  
  // Load user data
  async function loadUser(id) {
    user.value = await fetchUser(id);
    isDirty.value = false;
  }
  
  // Initial load
  loadUser(userId);
  
  // Handle route param changes
  onBeforeRouteUpdate(async (to, from, next) => {
    if (to.params.id !== from.params.id) {
      if (isDirty.value) {
        const confirmed = confirm('Discard changes and switch user?');
        if (!confirmed) {
          next(false);
          return;
        }
      }
      await loadUser(to.params.id);
    }
    next();
  });
  
  // Confirm before leaving
  onBeforeRouteLeave((to, from, next) => {
    if (isDirty.value) {
      const confirmed = confirm('You have unsaved changes. Leave anyway?');
      if (!confirmed) {
        next(false);
        return;
      }
    }
    next();
  });
  
  // Save and navigate
  async function saveAndClose() {
    await saveUser(user.value);
    isDirty.value = false;
    router.push('/users');
  }
  
  return (
    <div>
      <h1>Edit User {userId}</h1>
      <input 
        value={user.value?.name || ''} 
        onChange={(e) => {
          user.value = { ...user.value, name: e.target.value };
          isDirty.value = true;
        }}
      />
      <button onClick={saveAndClose}>Save & Close</button>
      <button onClick={() => router.back()}>Cancel</button>
    </div>
  );
}
```
