# Composition API

essor-router provides composition functions for accessing router and route information in your components.

## useRouter

Returns the router instance:

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

### Router Instance Properties

```tsx
const router = useRouter();

// Current route (Signal)
router.currentRoute.value;

// Router options
router.options;

// Listening state
router.listening;
```

### Router Instance Methods

```tsx
const router = useRouter();

// Navigation
router.push('/path');
router.replace('/path');
router.back();
router.forward();
router.go(-2);

// Route management
router.addRoute({ path: '/new', component: NewPage });
router.removeRoute('route-name');
router.hasRoute('route-name');
router.getRoutes();

// Route resolution
router.resolve('/path');
router.resolve({ name: 'route-name', params: { id: '123' } });

// Guards
router.beforeEach((to, from, next) => next());
router.beforeResolve((to, from, next) => next());
router.afterEach((to, from) => {});

// Error handling
router.onError((error) => {});

// Ready state
await router.isReady();
```

## useRoute

Returns the current route location:

```tsx
import { useRoute } from 'essor-router';

function MyComponent() {
  const route = useRoute();
  
  return (
    <div>
      <p>Path: {route.path}</p>
      <p>Full Path: {route.fullPath}</p>
    </div>
  );
}
```

### Route Properties

```tsx
const route = useRoute();

// Basic properties
route.path;        // '/user/123'
route.fullPath;    // '/user/123?tab=profile#bio'
route.name;        // 'user'
route.hash;        // '#bio'

// Parameters
route.params;      // { id: '123' }
route.query;       // { tab: 'profile' }

// Meta information
route.meta;        // { requiresAuth: true }

// Matched routes
route.matched;     // Array of matched route records

// Redirect information
route.redirectedFrom;  // Original route if redirected
```

## onBeforeRouteLeave

Register a guard that runs when leaving the current route:

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
  
  return <div>Editor content</div>;
}
```

## onBeforeRouteUpdate

Register a guard that runs when the route changes but the component is reused:

```tsx
import { onBeforeRouteUpdate, useRoute } from 'essor-router';

function UserProfile() {
  const route = useRoute();
  const user = signal(null);
  
  // Load initial user
  loadUser(route.params.id);
  
  // React to route param changes
  onBeforeRouteUpdate(async (to, from, next) => {
    if (to.params.id !== from.params.id) {
      user.value = await fetchUser(to.params.id);
    }
    next();
  });
  
  return <div>User: {user.value?.name}</div>;
}
```

## Practical Examples

### Navigation with Confirmation

```tsx
function useNavigationConfirm(shouldConfirm: () => boolean, message: string) {
  const router = useRouter();
  
  onBeforeRouteLeave((to, from, next) => {
    if (shouldConfirm()) {
      if (confirm(message)) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });
  
  return {
    navigate: (path: string) => {
      if (shouldConfirm()) {
        if (confirm(message)) {
          router.push(path);
        }
      } else {
        router.push(path);
      }
    },
  };
}

// Usage
function Editor() {
  const isDirty = signal(false);
  
  const { navigate } = useNavigationConfirm(
    () => isDirty.value,
    'You have unsaved changes. Leave anyway?'
  );
  
  return (
    <div>
      <button onClick={() => navigate('/')}>Home</button>
    </div>
  );
}
```

### Breadcrumbs

```tsx
function useBreadcrumbs() {
  const route = useRoute();
  
  return route.matched
    .filter(record => record.meta?.breadcrumb)
    .map(record => ({
      name: record.meta.breadcrumb,
      path: record.path,
    }));
}

function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs();
  
  return (
    <nav>
      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.path}>
          {i > 0 && ' / '}
          <RouterLink to={crumb.path}>{crumb.name}</RouterLink>
        </span>
      ))}
    </nav>
  );
}
```

### Page Title

```tsx
function usePageTitle(defaultTitle = 'My App') {
  const route = useRoute();
  
  // Update title when route changes
  const title = route.meta?.title;
  document.title = title ? `${title} | ${defaultTitle}` : defaultTitle;
}

function App() {
  usePageTitle('My App');
  
  return <RouterView />;
}
```

### Query Parameters

```tsx
function useQueryParams<T extends Record<string, string>>() {
  const route = useRoute();
  const router = useRouter();
  
  const setQuery = (params: Partial<T>) => {
    router.push({
      path: route.path,
      query: { ...route.query, ...params },
    });
  };
  
  const removeQuery = (...keys: (keyof T)[]) => {
    const newQuery = { ...route.query };
    keys.forEach(key => delete newQuery[key as string]);
    router.push({ path: route.path, query: newQuery });
  };
  
  return {
    query: route.query as T,
    setQuery,
    removeQuery,
  };
}

// Usage
function SearchPage() {
  const { query, setQuery } = useQueryParams<{ q: string; page: string }>();
  
  return (
    <div>
      <input
        value={query.q || ''}
        onChange={(e) => setQuery({ q: e.target.value })}
      />
      <p>Current page: {query.page || '1'}</p>
    </div>
  );
}
```

### Route Matching

```tsx
function useRouteMatch(pattern: string | RegExp) {
  const route = useRoute();
  
  if (typeof pattern === 'string') {
    return route.path === pattern || route.path.startsWith(`${pattern  }/`);
  }
  
  return pattern.test(route.path);
}

// Usage
function Navigation() {
  const isAdmin = useRouteMatch('/admin');
  const isUser = useRouteMatch(/^\/user\/\d+/);
  
  return (
    <nav>
      <RouterLink to="/admin" class={isAdmin ? 'active' : ''}>
        Admin
      </RouterLink>
    </nav>
  );
}
```

### Previous Route

```tsx
function usePreviousRoute() {
  const route = useRoute();
  let previousRoute = null;
  
  onBeforeRouteUpdate((to, from, next) => {
    previousRoute = { ...from };
    next();
  });
  
  return () => previousRoute;
}
```

### Scroll Position

```tsx
function useScrollPosition() {
  const route = useRoute();
  const router = useRouter();
  
  router.afterEach((to, from) => {
    if (to.hash) {
      const el = document.querySelector(to.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    
    if (to.path !== from.path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}
```
