# Lazy Loading Routes

Lazy loading allows you to split your application into smaller chunks that are loaded on demand, improving initial load time.

## Basic Lazy Loading

Use dynamic imports to lazy load route components:

```tsx
const routes = [
  {
    path: '/',
    component: Home, // Loaded immediately
  },
  {
    path: '/about',
    component: () => import('./pages/About'), // Loaded on demand
  },
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard'),
  },
];
```

## How It Works

When a user navigates to a lazy-loaded route:

1. The router detects the component is a function returning a Promise
2. The chunk is fetched from the server
3. The component is rendered once loaded

```
User clicks /dashboard
        │
        ▼
┌───────────────────┐
│ Fetch dashboard   │
│ chunk from server │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Parse and execute │
│ JavaScript        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Render Dashboard  │
│ component         │
└───────────────────┘
```

## Grouping Chunks

### Named Chunks (Webpack/Vite)

Use magic comments to name chunks:

```tsx
const routes = [
  {
    path: '/admin',
    component: () => import(/* webpackChunkName: "admin" */ './pages/Admin'),
  },
  {
    path: '/admin/users',
    component: () => import(/* webpackChunkName: "admin" */ './pages/AdminUsers'),
  },
];
```

Both components will be bundled into the same chunk named "admin".

### Vite Chunk Naming

```tsx
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard'), // dashboard.[hash].js
  },
];
```

Configure in `vite.config.ts`:

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          admin: ['./src/pages/Admin', './src/pages/AdminUsers'],
        },
      },
    },
  },
});
```

## Loading States

### Global Loading Indicator

```tsx
router.beforeEach((to, from, next) => {
  showLoadingBar();
  next();
});

router.afterEach(() => {
  hideLoadingBar();
});

router.onError(() => {
  hideLoadingBar();
});
```

### Component-Level Loading

Use `loadRouteLocation` to preload routes:

```tsx
import { loadRouteLocation } from 'essor-router';

function PreloadLink({ to, children }) {
  const router = useRouter();
  
  const preload = () => {
    const route = router.resolve(to);
    loadRouteLocation(route);
  };
  
  return (
    <RouterLink to={to} onMouseEnter={preload}>
      {children}
    </RouterLink>
  );
}
```

## Error Handling

Handle chunk loading failures:

```tsx
router.onError((error, to, from) => {
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    // Chunk failed to load, possibly due to a new deployment
    window.location.href = to.fullPath;
  }
});
```

### Retry Logic

```tsx
function lazyWithRetry(importFn, retries = 3) {
  return () => {
    return new Promise((resolve, reject) => {
      const attempt = (retriesLeft) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft > 0) {
              setTimeout(() => attempt(retriesLeft - 1), 1000);
            } else {
              reject(error);
            }
          });
      };
      attempt(retries);
    });
  };
}

const routes = [
  {
    path: '/dashboard',
    component: lazyWithRetry(() => import('./pages/Dashboard')),
  },
];
```

## Prefetching

### Prefetch on Hover

```tsx
function PrefetchLink({ to, children }) {
  const router = useRouter();
  let prefetched = false;
  
  const prefetch = async () => {
    if (prefetched) return;
    prefetched = true;
    
    const route = router.resolve(to);
    try {
      await loadRouteLocation(route);
    } catch {
      // Ignore prefetch errors
    }
  };
  
  return (
    <RouterLink to={to} onMouseEnter={prefetch}>
      {children}
    </RouterLink>
  );
}
```

### Prefetch Visible Links

```tsx
function PrefetchOnVisible({ to, children }) {
  const router = useRouter();
  let observer;
  
  const ref = (el) => {
    if (!el) return;
    
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const route = router.resolve(to);
          loadRouteLocation(route).catch(() => {});
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(el);
  };
  
  return (
    <RouterLink to={to} ref={ref}>
      {children}
    </RouterLink>
  );
}
```

## Lazy Loading Nested Routes

```tsx
const routes = [
  {
    path: '/admin',
    component: () => import('./layouts/AdminLayout'),
    children: [
      {
        path: '',
        component: () => import('./pages/admin/Dashboard'),
      },
      {
        path: 'users',
        component: () => import('./pages/admin/Users'),
      },
      {
        path: 'settings',
        component: () => import('./pages/admin/Settings'),
      },
    ],
  },
];
```

## Best Practices

### 1. Lazy Load Route-Level Components

```tsx
// ✅ Good - lazy load pages
const routes = [
  { path: '/about', component: () => import('./pages/About') },
];

// ❌ Avoid - lazy loading small shared components
function About() {
  const Button = () => import('./components/Button'); // Don't do this
}
```

### 2. Group Related Routes

```tsx
// Group admin routes together
const adminRoutes = [
  { path: '/admin', component: () => import('./pages/admin/Index') },
  { path: '/admin/users', component: () => import('./pages/admin/Users') },
  { path: '/admin/settings', component: () => import('./pages/admin/Settings') },
];
```

### 3. Preload Critical Routes

```tsx
// Preload dashboard after login
async function handleLogin() {
  await login();
  
  // Start loading dashboard while redirecting
  const dashboardRoute = router.resolve('/dashboard');
  loadRouteLocation(dashboardRoute);
  
  router.push('/dashboard');
}
```

### 4. Consider Initial Bundle Size

Keep frequently accessed routes in the main bundle:

```tsx
import Home from './pages/Home'; // In main bundle
import About from './pages/About'; // In main bundle

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/dashboard', component: () => import('./pages/Dashboard') }, // Lazy
  { path: '/settings', component: () => import('./pages/Settings') }, // Lazy
];
```
