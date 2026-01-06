# Named Routes

Named routes allow you to reference routes by name instead of path, making navigation more maintainable.

## Defining Named Routes

Add a `name` property to your route:

```tsx
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/user/:id',
    name: 'user',
    component: User,
  },
  {
    path: '/user/:id/profile',
    name: 'user-profile',
    component: UserProfile,
  },
];
```

## Navigating by Name

### With RouterLink

```tsx
<RouterLink to={{ name: 'home' }}>Home</RouterLink>

<RouterLink to={{ name: 'user', params: { id: '123' } }}>
  User 123
</RouterLink>

<RouterLink to={{ name: 'user-profile', params: { id: '123' }, query: { tab: 'bio' } }}>
  User Profile
</RouterLink>
```

### Programmatically

```tsx
const router = useRouter();

// Navigate to named route
router.push({ name: 'home' });

// With params
router.push({ name: 'user', params: { id: '123' } });

// With query and hash
router.push({
  name: 'user-profile',
  params: { id: '123' },
  query: { tab: 'bio' },
  hash: '#section',
});
```

## Benefits of Named Routes

### 1. Refactoring Safety

If you change a route's path, all navigation using the name still works:

```tsx
// Before
{ path: '/user/:id', name: 'user', component: User }

// After - navigation code doesn't need to change
{ path: '/profile/:id', name: 'user', component: User }
```

### 2. Type Safety

Named routes work better with TypeScript for catching errors:

```tsx
// TypeScript can help catch typos in route names
router.push({ name: 'usr' }); // Error if 'usr' doesn't exist
```

### 3. Cleaner Code

Named routes are more readable than path strings:

```tsx
// Path-based (harder to understand)
router.push(`/user/${userId}/posts/${postId}/comments`);

// Named route (clearer intent)
router.push({
  name: 'post-comments',
  params: { userId, postId },
});
```

## Naming Conventions

Use consistent naming conventions for your routes:

```tsx
const routes = [
  // Use kebab-case
  { path: '/', name: 'home', component: Home },
  { path: '/about', name: 'about', component: About },
  
  // Prefix nested routes with parent name
  { path: '/user/:id', name: 'user', component: User },
  { path: '/user/:id/profile', name: 'user-profile', component: UserProfile },
  { path: '/user/:id/settings', name: 'user-settings', component: UserSettings },
  
  // Use descriptive names for actions
  { path: '/user/new', name: 'user-create', component: UserCreate },
  { path: '/user/:id/edit', name: 'user-edit', component: UserEdit },
];
```

## Checking Current Route Name

```tsx
import { useRoute } from 'essor-router';

function Navigation() {
  const route = useRoute();
  
  return (
    <nav>
      <RouterLink 
        to={{ name: 'home' }}
        class={route.name === 'home' ? 'active' : ''}
      >
        Home
      </RouterLink>
    </nav>
  );
}
```

## Route Name Uniqueness

Route names must be unique across your entire application:

```tsx
// ❌ Bad - duplicate names
const routes = [
  { path: '/admin/users', name: 'users', component: AdminUsers },
  { path: '/public/users', name: 'users', component: PublicUsers }, // Conflict!
];

// ✅ Good - unique names
const routes = [
  { path: '/admin/users', name: 'admin-users', component: AdminUsers },
  { path: '/public/users', name: 'public-users', component: PublicUsers },
];
```

## Named Routes with Nested Children

```tsx
const routes = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    children: [
      { path: '', name: 'dashboard-home', component: DashboardHome },
      { path: 'analytics', name: 'dashboard-analytics', component: Analytics },
      { path: 'settings', name: 'dashboard-settings', component: Settings },
    ],
  },
];

// Navigate to nested route
router.push({ name: 'dashboard-analytics' });
```

## Resolving Named Routes

Use `router.resolve()` to get the URL for a named route:

```tsx
const router = useRouter();

const resolved = router.resolve({ name: 'user', params: { id: '123' } });
console.log(resolved.href); // '/user/123'
console.log(resolved.fullPath); // '/user/123'
```

This is useful for generating URLs without navigating:

```tsx
function ShareButton({ userId }) {
  const router = useRouter();
  
  const shareUrl = router.resolve({
    name: 'user-profile',
    params: { id: userId },
  }).href;
  
  const share = () => {
    navigator.clipboard.writeText(window.location.origin + shareUrl);
  };
  
  return <button onClick={share}>Copy Profile Link</button>;
}
```
