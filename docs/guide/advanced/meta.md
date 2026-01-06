# Route Meta Fields

Route meta fields allow you to attach arbitrary data to routes.

## Defining Meta Fields

Add a `meta` property to your route:

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      roles: ['admin'],
      title: 'Admin Dashboard',
    },
  },
  {
    path: '/public',
    component: PublicPage,
    meta: {
      requiresAuth: false,
      title: 'Public Page',
    },
  },
];
```

## Accessing Meta Fields

### In Navigation Guards

```tsx
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});
```

### In Components

```tsx
import { useRoute } from 'essor-router';

function PageHeader() {
  const route = useRoute();
  
  return <h1>{route.meta.title}</h1>;
}
```

### Merged Meta from Matched Routes

When using nested routes, meta fields are merged from all matched routes:

```tsx
const routes = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'users',
        component: UserManagement,
        meta: { roles: ['admin'] },
      },
    ],
  },
];

// When visiting /admin/users:
// route.meta = { requiresAuth: true, roles: ['admin'] }
```

To check meta from any matched route:

```tsx
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  // ...
});
```

## TypeScript Support

Extend the `RouteMeta` interface for type safety:

```tsx
// types.d.ts
import 'essor-router';

declare module 'essor-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
    title?: string;
    transition?: string;
    keepAlive?: boolean;
  }
}
```

Now you get autocomplete and type checking:

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,  // ✅ Type checked
      roles: ['admin'],    // ✅ Type checked
      invalid: true,       // ❌ Type error
    },
  },
];
```

## Common Use Cases

### Authentication

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    component: Login,
    meta: { requiresAuth: false, guestOnly: true },
  },
];

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!getToken();
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else if (to.meta.guestOnly && isLoggedIn) {
    next('/dashboard');
  } else {
    next();
  }
});
```

### Role-Based Access Control

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: { roles: ['admin'] },
  },
  {
    path: '/editor',
    component: Editor,
    meta: { roles: ['admin', 'editor'] },
  },
];

router.beforeEach((to, from, next) => {
  const requiredRoles = to.meta.roles;
  
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = getCurrentUserRoles();
    const hasPermission = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasPermission) {
      next('/forbidden');
      return;
    }
  }
  
  next();
});
```

### Page Titles

```tsx
const routes = [
  { path: '/', component: Home, meta: { title: 'Home' } },
  { path: '/about', component: About, meta: { title: 'About Us' } },
  { path: '/contact', component: Contact, meta: { title: 'Contact' } },
];

router.afterEach((to) => {
  const baseTitle = 'My App';
  document.title = to.meta.title 
    ? `${to.meta.title} | ${baseTitle}` 
    : baseTitle;
});
```

### Page Transitions

```tsx
const routes = [
  { path: '/', component: Home, meta: { transition: 'fade' } },
  { path: '/about', component: About, meta: { transition: 'slide-left' } },
];

function App() {
  const route = useRoute();
  
  return (
    <div class={`transition-${route.meta.transition}`}>
      <RouterView />
    </div>
  );
}
```

### Breadcrumbs

```tsx
const routes = [
  {
    path: '/',
    component: Home,
    meta: { breadcrumb: 'Home' },
  },
  {
    path: '/products',
    component: Products,
    meta: { breadcrumb: 'Products' },
    children: [
      {
        path: ':id',
        component: ProductDetail,
        meta: { breadcrumb: 'Product Details' },
      },
    ],
  },
];

function Breadcrumbs() {
  const route = useRoute();
  
  const breadcrumbs = route.matched
    .filter(record => record.meta.breadcrumb)
    .map(record => ({
      name: record.meta.breadcrumb,
      path: record.path,
    }));
  
  return (
    <nav>
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path}>
          {index > 0 && ' > '}
          <RouterLink to={crumb.path}>{crumb.name}</RouterLink>
        </span>
      ))}
    </nav>
  );
}
```

### Layout Selection

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { layout: 'admin' },
  },
  {
    path: '/login',
    component: Login,
    meta: { layout: 'auth' },
  },
  {
    path: '/',
    component: Home,
    meta: { layout: 'default' },
  },
];

function App() {
  const route = useRoute();
  const layout = route.meta.layout || 'default';
  
  const layouts = {
    default: DefaultLayout,
    admin: AdminLayout,
    auth: AuthLayout,
  };
  
  const Layout = layouts[layout];
  
  return (
    <Layout>
      <RouterView />
    </Layout>
  );
}
```

### Analytics

```tsx
const routes = [
  {
    path: '/checkout',
    component: Checkout,
    meta: { 
      trackPageView: true,
      pageCategory: 'conversion',
    },
  },
];

router.afterEach((to) => {
  if (to.meta.trackPageView) {
    analytics.trackPageView({
      path: to.fullPath,
      category: to.meta.pageCategory,
    });
  }
});
```
