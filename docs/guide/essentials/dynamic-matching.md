# Dynamic Route Matching

Dynamic route matching allows you to match routes with variable segments in the URL path.

## Basic Dynamic Segments

Use `:paramName` to define a dynamic segment:

```tsx
const routes = [
  { path: '/user/:id', component: User },
];
```

This matches `/user/123`, `/user/abc`, etc. The value is available as `route.params.id`.

### Accessing Parameters

```tsx
import { useRoute } from 'essor-router';

function User() {
  const route = useRoute();
  
  return <div>User ID: {route.params.id}</div>;
}
```

## Multiple Dynamic Segments

You can have multiple dynamic segments in a single route:

```tsx
const routes = [
  { path: '/user/:userId/post/:postId', component: Post },
];
```

| Pattern | Matched Path | params |
|---------|--------------|--------|
| `/user/:userId/post/:postId` | `/user/123/post/456` | `{ userId: '123', postId: '456' }` |

## Optional Parameters

Add `?` to make a parameter optional:

```tsx
const routes = [
  { path: '/user/:id?', component: User },
];
```

| Pattern | Matched Path | params |
|---------|--------------|--------|
| `/user/:id?` | `/user` | `{}` |
| `/user/:id?` | `/user/123` | `{ id: '123' }` |

## Repeatable Parameters

Use `+` for one or more segments, or `*` for zero or more:

```tsx
const routes = [
  // Matches /files/a, /files/a/b, /files/a/b/c, etc.
  { path: '/files/:path+', component: Files },
  
  // Matches /files, /files/a, /files/a/b, etc.
  { path: '/docs/:path*', component: Docs },
];
```

| Pattern | Matched Path | params |
|---------|--------------|--------|
| `/files/:path+` | `/files/a/b/c` | `{ path: ['a', 'b', 'c'] }` |
| `/docs/:path*` | `/docs` | `{ path: [] }` |
| `/docs/:path*` | `/docs/a/b` | `{ path: ['a', 'b'] }` |

## Custom Regex

Add a custom regex pattern in parentheses:

```tsx
const routes = [
  // Only matches numeric IDs
  { path: '/user/:id(\\d+)', component: User },
  
  // Only matches specific values
  { path: '/order/:status(pending|completed|cancelled)', component: Order },
];
```

| Pattern | Matched Path | Not Matched |
|---------|--------------|-------------|
| `/user/:id(\\d+)` | `/user/123` | `/user/abc` |
| `/order/:status(pending\|completed)` | `/order/pending` | `/order/unknown` |

## Catch-All Routes

Use `(.*)` to match any path:

```tsx
const routes = [
  // Catch-all for 404
  { path: '/:pathMatch(.*)*', component: NotFound },
];
```

The `pathMatch` parameter will contain the matched path segments as an array.

## Sensitive and Strict Matching

Configure case sensitivity and trailing slash behavior:

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    sensitive: true,  // Case-sensitive matching
    strict: true,     // Strict trailing slash
  },
];
```

| Option | Default | Description |
|--------|---------|-------------|
| `sensitive` | `false` | Case-sensitive matching |
| `strict` | `false` | Disallow trailing slash |

## Reacting to Parameter Changes

When navigating between routes that use the same component (e.g., `/user/1` to `/user/2`), the component is reused. Use `onBeforeRouteUpdate` to react to changes:

```tsx
import { onBeforeRouteUpdate, useRoute } from 'essor-router';

function User() {
  const route = useRoute();
  
  onBeforeRouteUpdate((to, from, next) => {
    // React to route changes
    console.log(`User changed from ${from.params.id} to ${to.params.id}`);
    next();
  });
  
  return <div>User ID: {route.params.id}</div>;
}
```

## Examples

### Blog Post Route

```tsx
const routes = [
  {
    path: '/blog/:year(\\d{4})/:month(\\d{2})/:slug',
    component: BlogPost,
  },
];

// Matches: /blog/2024/01/my-post
// params: { year: '2024', month: '01', slug: 'my-post' }
```

### File Browser Route

```tsx
const routes = [
  {
    path: '/files/:path*',
    component: FileBrowser,
  },
];

// Matches: /files/documents/reports/2024
// params: { path: ['documents', 'reports', '2024'] }
```

### User Profile with Optional Tab

```tsx
const routes = [
  {
    path: '/user/:id/:tab?',
    component: UserProfile,
  },
];

// Matches: /user/123 -> { id: '123' }
// Matches: /user/123/posts -> { id: '123', tab: 'posts' }
```
