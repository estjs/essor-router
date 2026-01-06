# Introduction

essor-router is the official routing library for [Essor](https://github.com/estjs/essor), a modern frontend framework. It provides a powerful and flexible routing solution, with full TypeScript support.

## Why essor-router?

Building single-page applications (SPAs) requires a robust routing solution that can handle:

- **URL Management**: Map URLs to components and manage browser history
- **Navigation Control**: Guard routes and control access based on conditions
- **Code Organization**: Structure your application with nested routes and lazy loading
- **Type Safety**: Catch routing errors at compile time with TypeScript

essor-router addresses all these needs while maintaining a simple and intuitive API.

## Features

### Multiple History Modes

Choose the history mode that fits your deployment:

- **HTML5 History Mode**: Clean URLs like `/user/123` (requires server configuration)
- **Hash Mode**: URLs with hash like `/#/user/123` (works everywhere)
- **Memory Mode**: No URL changes, perfect for SSR and testing

### Powerful Route Matching

Define routes with dynamic segments, optional parameters, and custom patterns:

```tsx
const routes = [
  { path: '/user/:id', component: User },           // Dynamic segment
  { path: '/user/:id?', component: User },          // Optional segment
  { path: '/files/:path+', component: Files },      // One or more segments
  { path: '/user/:id(\\d+)', component: User },     // Custom regex
];
```

### Navigation Guards

Control navigation with guards at multiple levels:

- **Global Guards**: `beforeEach`, `beforeResolve`, `afterEach`
- **Per-Route Guards**: `beforeEnter`, `beforeLeave`
- **In-Component Guards**: `onBeforeRouteLeave`, `onBeforeRouteUpdate`

### Composition API

Access router and route information with hooks:

```tsx
import { useRoute, useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  const route = useRoute();
  
  // Navigate programmatically
  router.push('/new-path');
  
  // Access route information
  console.log(route.params.id);
}
```

## Getting Started

Ready to start? Head to the [Installation](/guide/installation) page to set up essor-router in your project.
