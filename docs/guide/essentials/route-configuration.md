# Route Configuration

Routes are defined as an array of route records. Each route record maps a URL path to a component.

## Basic Routes

```tsx
import { createRouter } from 'essor-router';

const router = createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/contact', component: Contact },
  ],
});
```

## Route Record Properties

### path

The URL path pattern to match.

```tsx
{ path: '/users', component: Users }
```

### component

The component to render when the route matches.

```tsx
{ path: '/about', component: About }
```

### components

For named views, specify multiple components:

```tsx
{
  path: '/dashboard',
  components: {
    default: DashboardMain,
    sidebar: DashboardSidebar,
  },
}
```

### name

A unique name for the route:

```tsx
{
  path: '/user/:id',
  name: 'user',
  component: User,
}
```

### redirect

Redirect to another location:

```tsx
// String redirect
{ path: '/home', redirect: '/' }

// Named route redirect
{ path: '/home', redirect: { name: 'homepage' } }

// Function redirect
{
  path: '/search',
  redirect: (to) => {
    return { path: '/results', query: { q: to.params.searchText } };
  },
}
```

### alias

Alternative paths for the same route:

```tsx
{ path: '/users', component: Users, alias: '/people' }

// Multiple aliases
{ path: '/users', component: Users, alias: ['/people', '/members'] }
```

### meta

Custom data attached to the route:

```tsx
{
  path: '/admin',
  component: Admin,
  meta: {
    requiresAuth: true,
    roles: ['admin'],
  },
}
```

### children

Nested routes:

```tsx
{
  path: '/user/:id',
  component: User,
  children: [
    { path: '', component: UserHome },
    { path: 'profile', component: UserProfile },
    { path: 'posts', component: UserPosts },
  ],
}
```

### beforeEnter

Route-specific navigation guard:

```tsx
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
}
```

### props

Pass route params as props to the component:

```tsx
// Boolean mode - pass all params as props
{ path: '/user/:id', component: User, props: true }

// Object mode - static props
{ path: '/about', component: About, props: { newsletter: true } }

// Function mode - dynamic props
{
  path: '/search',
  component: Search,
  props: (route) => ({ query: route.query.q }),
}
```

## Complete Example

```tsx
const routes = [
  // Basic route
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  
  // Route with meta
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: { title: 'About Us' },
  },
  
  // Dynamic route with props
  {
    path: '/user/:id',
    name: 'user',
    component: User,
    props: true,
  },
  
  // Nested routes
  {
    path: '/dashboard',
    component: Dashboard,
    children: [
      { path: '', name: 'dashboard-home', component: DashboardHome },
      { path: 'settings', name: 'dashboard-settings', component: DashboardSettings },
    ],
  },
  
  // Named views
  {
    path: '/layout',
    components: {
      default: Main,
      sidebar: Sidebar,
      header: Header,
    },
  },
  
  // Redirect
  { path: '/old-path', redirect: '/new-path' },
  
  // Alias
  { path: '/users', component: Users, alias: '/people' },
  
  // Protected route
  {
    path: '/admin',
    component: Admin,
    meta: { requiresAuth: true },
    beforeEnter: (to, from, next) => {
      if (!isAuthenticated()) {
        next('/login');
      } else {
        next();
      }
    },
  },
  
  // Catch-all 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
];
```

## Route Matching Priority

Routes are matched in the order they are defined. More specific routes should be defined before less specific ones:

```tsx
const routes = [
  { path: '/user/new', component: UserNew },      // Specific path first
  { path: '/user/:id', component: User },         // Dynamic path second
  { path: '/:pathMatch(.*)*', component: NotFound }, // Catch-all last
];
```
