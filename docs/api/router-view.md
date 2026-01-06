# RouterView

The `RouterView` component renders the matched component for the current route.

## Basic Usage

```tsx
import { RouterView } from 'essor-router';

function App() {
  return (
    <div>
      <RouterView router={router} />
    </div>
  );
}
```

## Props

### router

- **Type:** `Router`
- **Required:** No (if provided via context)

The router instance:

```tsx
<RouterView router={router} />
```

If not provided, RouterView will try to inject the router from context.

### name

- **Type:** `string`
- **Default:** `'default'`

The name of the view for named views:

```tsx
<RouterView name="sidebar" />
<RouterView name="header" />
<RouterView /> {/* default */}
```

### route

- **Type:** `RouteLocationNormalized`
- **Required:** No

Override the route to display:

```tsx
const customRoute = router.resolve('/custom-path');
<RouterView route={customRoute} />
```

### fallback

- **Type:** `Component`
- **Required:** No

Fallback component when rendering fails:

```tsx
<RouterView fallback={ErrorFallback} />
```

### onError

- **Type:** `(error: Error) => void`
- **Required:** No

Error handler for component rendering errors:

```tsx
<RouterView onError={(error) => console.error(error)} />
```

### children

- **Type:** `ReactNode`
- **Required:** No

Content to render when no route matches:

```tsx
<RouterView>
  <div>No route matched</div>
</RouterView>
```

## Named Views

Use multiple RouterView components with different names:

```tsx
// Route configuration
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

// Layout
function Layout() {
  return (
    <div class="layout">
      <RouterView name="header" />
      <div class="body">
        <RouterView name="sidebar" />
        <RouterView /> {/* default */}
      </div>
    </div>
  );
}
```

## Nested Routes

RouterView automatically handles nested routes:

```tsx
// Route configuration
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      { path: '', component: UserHome },
      { path: 'profile', component: UserProfile },
    ],
  },
];

// User component with nested RouterView
function User() {
  return (
    <div>
      <h1>User</h1>
      <RouterView /> {/* Renders UserHome or UserProfile */}
    </div>
  );
}
```

## Context Injection

RouterView provides context for child components:

- `routerKey` - Router instance
- `routeLocationKey` - Current route
- `viewDepthKey` - Current view depth
- `matchedRouteKey` - Current matched route

This allows `useRouter()` and `useRoute()` to work in child components.

## Example

```tsx
import { RouterLink, RouterView, createRouter } from 'essor-router';

const router = createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    {
      path: '/dashboard',
      components: {
        default: DashboardMain,
        sidebar: DashboardSidebar,
      },
    },
  ],
});

function App() {
  return (
    <div>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/dashboard">Dashboard</RouterLink>
      </nav>
      
      <main>
        <RouterView 
          router={router}
          onError={(error) => {
            console.error('Route component error:', error);
          }}
        >
          <div>Loading...</div>
        </RouterView>
      </main>
    </div>
  );
}
```

## Multiple RouterViews

```tsx
function DashboardLayout() {
  return (
    <div class="dashboard">
      <header>
        <RouterView name="header" />
      </header>
      
      <aside>
        <RouterView name="sidebar" />
      </aside>
      
      <main>
        <RouterView />
      </main>
      
      <footer>
        <RouterView name="footer" />
      </footer>
    </div>
  );
}
```
