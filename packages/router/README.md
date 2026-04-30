# essor-router

A modern, type-safe, and fully-featured routing library for modern web applications.

## Features

- **Type-safe Routing:** Strong TypeScript support for route parameters, queries, and locations.
- **Flexible History Modes:** Supports `createWebHistory`, `createMemoryHistory`, and `createWebHashHistory`.
- **Nested Routes & Views:** Easily manage complex layouts with nested `RouterView`.
- **Navigation Guards:** Built-in hooks like `onBeforeRouteLeave` and `onBeforeRouteUpdate` for controlling navigation.
- **Route Loaders:** Experimental support for route data loaders, enabling declarative data fetching.
- **Scroll Behavior:** Customizable scroll behavior during navigation.

## Installation

```bash
npm install essor-router
# or
yarn add essor-router
# or
pnpm add essor-router
```

## Basic Usage

```typescript
import { createRouter, createWebHistory, RouterView, RouterLink } from 'essor-router';

// Define your routes
const routes = [
  { path: '/', component: () => import('./pages/Home.vue') },
  { path: '/about', component: () => import('./pages/About.vue') },
];

// Create the router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Use it in your application setup
```

## TypeScript Integration

For the best developer experience, we strongly recommend using our [TypeScript Plugin](../ts-plugin/README.md) to enable automatic type inference for your routes, parameters, and navigation APIs directly inside your IDE without extra boilerplate.

```typescript
import { RouteRecordRaw } from 'essor-router';

const route: RouteRecordRaw = {
  path: '/user/:id',
  component: UserProfile,
};
```

## Advanced Usage

### Navigation Guards

```typescript
router.beforeEach((to, from, next) => {
  // Add authentication or analytics checking
  next();
});
```

### Route Loaders (Experimental)

Use loaders to fetch data asynchronously before navigating to the route.

```typescript
const routes = [
  {
    path: '/post/:id',
    loader: async ({ params }) => {
      return fetchPost(params.id);
    },
    component: BlogPost,
  }
];
```

## License

MIT
