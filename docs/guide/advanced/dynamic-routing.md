# Dynamic Routing

Dynamic routing allows you to add or remove routes at runtime, enabling features like permission-based menus and plugin systems.

## Adding Routes

### addRoute()

Add a new route to the router:

```tsx
const router = useRouter();

// Add a top-level route
router.addRoute({
  path: '/new-page',
  name: 'new-page',
  component: NewPage,
});
```

### Adding Child Routes

Add a route as a child of an existing route:

```tsx
// Add child to a named parent route
router.addRoute('parent-route-name', {
  path: 'child',
  name: 'child-route',
  component: ChildComponent,
});
```

### Return Value

`addRoute()` returns a function to remove the added route:

```tsx
const removeRoute = router.addRoute({
  path: '/temporary',
  component: TempPage,
});

// Later, remove the route
removeRoute();
```

## Removing Routes

### By Name

```tsx
router.removeRoute('route-name');
```

### Using the Remove Function

```tsx
const remove = router.addRoute({ path: '/temp', component: Temp });
remove(); // Removes the route
```

### Removing by Adding a Conflicting Route

Adding a route with the same name replaces the existing one:

```tsx
router.addRoute({ path: '/about', name: 'about', component: About });
router.addRoute({ path: '/about-new', name: 'about', component: AboutNew });
// The first route is replaced
```

## Checking Routes

### hasRoute()

Check if a route exists:

```tsx
if (router.hasRoute('admin')) {
  console.log('Admin route exists');
}
```

### getRoutes()

Get all registered routes:

```tsx
const routes = router.getRoutes();
routes.forEach(route => {
  console.log(route.path, route.name);
});
```

## Practical Examples

### Permission-Based Routes

```tsx
async function setupRoutes() {
  const permissions = await fetchUserPermissions();
  
  if (permissions.includes('admin')) {
    router.addRoute({
      path: '/admin',
      name: 'admin',
      component: () => import('./pages/Admin'),
      children: [
        { path: 'users', component: () => import('./pages/AdminUsers') },
        { path: 'settings', component: () => import('./pages/AdminSettings') },
      ],
    });
  }
  
  if (permissions.includes('analytics')) {
    router.addRoute({
      path: '/analytics',
      name: 'analytics',
      component: () => import('./pages/Analytics'),
    });
  }
}

// Call after login
async function handleLogin() {
  await login();
  await setupRoutes();
  router.push('/dashboard');
}
```

### Plugin System

```tsx
// Plugin interface
interface RouterPlugin {
  name: string;
  routes: RouteRecordRaw[];
  install: (router: Router) => void;
}

// Register a plugin
function registerPlugin(plugin: RouterPlugin) {
  plugin.routes.forEach(route => {
    router.addRoute(route);
  });
  plugin.install(router);
}

// Example plugin
const analyticsPlugin: RouterPlugin = {
  name: 'analytics',
  routes: [
    { path: '/analytics', component: AnalyticsDashboard },
    { path: '/analytics/reports', component: Reports },
  ],
  install(router) {
    router.beforeEach((to) => {
      if (to.path.startsWith('/analytics')) {
        trackPageView(to.path);
      }
    });
  },
};

registerPlugin(analyticsPlugin);
```

### Feature Flags

```tsx
async function setupFeatureRoutes() {
  const features = await fetchFeatureFlags();
  
  if (features.newDashboard) {
    // Replace old dashboard with new one
    router.addRoute({
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('./pages/NewDashboard'),
    });
  }
  
  if (features.betaFeatures) {
    router.addRoute({
      path: '/beta',
      name: 'beta',
      component: () => import('./pages/BetaFeatures'),
    });
  }
}
```

### Multi-Tenant Routes

```tsx
async function setupTenantRoutes(tenantId: string) {
  const tenantConfig = await fetchTenantConfig(tenantId);
  
  // Add tenant-specific routes
  tenantConfig.modules.forEach(module => {
    router.addRoute({
      path: `/${module.path}`,
      name: module.name,
      component: () => import(`./modules/${module.component}`),
      meta: { tenant: tenantId },
    });
  });
}
```

### Dynamic Menu Generation

```tsx
function generateMenu() {
  const routes = router.getRoutes();
  
  return routes
    .filter(route => route.meta?.showInMenu)
    .map(route => ({
      path: route.path,
      name: route.meta.menuTitle || route.name,
      icon: route.meta.menuIcon,
    }));
}

function SideMenu() {
  const menuItems = generateMenu();
  
  return (
    <nav>
      {menuItems.map(item => (
        <RouterLink to={item.path} key={item.path}>
          <Icon name={item.icon} />
          {item.name}
        </RouterLink>
      ))}
    </nav>
  );
}
```

## Navigation After Adding Routes

When adding routes and immediately navigating:

```tsx
router.addRoute({ path: '/new', component: NewPage });

// The route might not be ready yet
// Use router.replace to ensure navigation works
router.replace(router.currentRoute.value.fullPath);

// Or navigate to the new route
router.push('/new');
```

## Removing Routes on Logout

```tsx
function handleLogout() {
  // Remove protected routes
  router.removeRoute('admin');
  router.removeRoute('dashboard');
  router.removeRoute('settings');
  
  // Clear auth state
  clearAuthToken();
  
  // Redirect to login
  router.push('/login');
}
```

## Best Practices

### 1. Add Routes Early

Add dynamic routes as early as possible, ideally before the initial navigation:

```tsx
async function initApp() {
  // Fetch user and permissions
  const user = await fetchCurrentUser();
  
  // Add routes based on permissions
  await setupRoutes(user.permissions);
  
  // Now mount the app
  createApp(App, '#app');
}
```

### 2. Handle Missing Routes

```tsx
router.beforeEach((to, from, next) => {
  // Check if route exists
  if (!router.hasRoute(to.name)) {
    next('/404');
  } else {
    next();
  }
});
```

### 3. Clean Up on User Change

```tsx
async function switchUser(newUserId: string) {
  // Remove current user's routes
  currentUserRoutes.forEach(name => router.removeRoute(name));
  
  // Add new user's routes
  const permissions = await fetchPermissions(newUserId);
  currentUserRoutes = await setupRoutes(permissions);
}
```
