# Redirect and Alias

## Redirect

Redirecting allows you to automatically navigate from one route to another.

### Basic Redirect

```tsx
const routes = [
  { path: '/home', redirect: '/' },
  { path: '/', component: Home },
];
```

When the user visits `/home`, they will be redirected to `/`.

### Redirect to Named Route

```tsx
const routes = [
  { path: '/home', redirect: { name: 'homepage' } },
  { path: '/', name: 'homepage', component: Home },
];
```

### Dynamic Redirect

Use a function for dynamic redirects:

```tsx
const routes = [
  {
    path: '/search/:searchText',
    redirect: (to) => {
      return { path: '/results', query: { q: to.params.searchText } };
    },
  },
];
```

### Redirect with Query Preservation

```tsx
const routes = [
  {
    path: '/old-search',
    redirect: (to) => {
      return { path: '/search', query: to.query };
    },
  },
];
```

### Relative Redirect

```tsx
const routes = [
  {
    path: '/users/:id',
    children: [
      { path: '', redirect: 'profile' }, // Redirects to /users/:id/profile
      { path: 'profile', component: UserProfile },
    ],
  },
];
```

### Redirect in Nested Routes

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    redirect: '/dashboard/overview', // Redirect to child
    children: [
      { path: 'overview', component: Overview },
      { path: 'stats', component: Stats },
    ],
  },
];
```

## Alias

An alias gives a route an additional path without changing the URL.

### Basic Alias

```tsx
const routes = [
  { path: '/users', component: Users, alias: '/people' },
];
```

Both `/users` and `/people` will render the `Users` component, but the URL stays as visited.

### Multiple Aliases

```tsx
const routes = [
  {
    path: '/users',
    component: Users,
    alias: ['/people', '/members', '/team'],
  },
];
```

### Alias with Parameters

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    alias: '/profile/:id',
  },
];
```

Both `/user/123` and `/profile/123` render the same component.

### Nested Route Alias

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    children: [
      {
        path: 'settings',
        component: Settings,
        alias: '/settings', // Absolute alias
      },
    ],
  },
];
```

Both `/dashboard/settings` and `/settings` render the Settings component.

## Redirect vs Alias

| Feature | Redirect | Alias |
|---------|----------|-------|
| URL changes | Yes | No |
| Navigation guards | Triggered twice | Triggered once |
| Use case | Deprecated URLs, authentication | SEO, user convenience |

### When to Use Redirect

- Moving content to a new URL
- Authentication flows (redirect to login)
- Deprecated routes
- Default child routes

```tsx
// Redirect deprecated URL
{ path: '/old-page', redirect: '/new-page' }

// Redirect to login
{
  path: '/dashboard',
  redirect: (to) => {
    if (!isAuthenticated()) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }
    return false; // Don't redirect
  },
}
```

### When to Use Alias

- Multiple URLs for the same content
- SEO-friendly URLs
- User convenience

```tsx
// SEO-friendly alias
{ path: '/products/:id', component: Product, alias: '/p/:id' }

// Convenience alias
{ path: '/settings/account', component: AccountSettings, alias: '/account' }
```

## Practical Examples

### Authentication Redirect

```tsx
const routes = [
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/dashboard',
    component: Dashboard,
    beforeEnter: (to, from, next) => {
      if (!isAuthenticated()) {
        next({ path: '/login', query: { redirect: to.fullPath } });
      } else {
        next();
      }
    },
  },
];

// After login, redirect back
function Login() {
  const router = useRouter();
  const route = useRoute();
  
  const handleLogin = async () => {
    await login();
    const redirect = route.query.redirect || '/dashboard';
    router.push(redirect);
  };
}
```

### Language Redirect

```tsx
const routes = [
  {
    path: '/',
    redirect: () => {
      const lang = navigator.language.split('-')[0];
      return `/${lang}`;
    },
  },
  { path: '/en', component: EnglishHome },
  { path: '/zh', component: ChineseHome },
];
```

### Version Alias

```tsx
const routes = [
  {
    path: '/api/v2/users',
    component: UsersAPI,
    alias: ['/api/users', '/api/v1/users'], // Support old versions
  },
];
```

### 404 Redirect

```tsx
const routes = [
  // ... other routes
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
  {
    path: '/404',
    component: NotFound,
  },
];
```
