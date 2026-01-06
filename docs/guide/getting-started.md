# Quick Start

This guide will walk you through creating a basic application with essor-router.

## Basic Setup

### 1. Create Components

First, create some simple page components:

```tsx
// Home.tsx
function Home() {
  return <div>Welcome to the Home Page</div>;
}

// About.tsx
function About() {
  return <div>About Us</div>;
}

// NotFound.tsx
function NotFound() {
  return <div>404 - Page Not Found</div>;
}
```

### 2. Create Router

Create a router instance with your routes:

```tsx
// router.ts
import { createRouter } from 'essor-router';
import Home from './Home';
import About from './About';
import NotFound from './NotFound';

export const router = createRouter({
  history: 'history', // Use HTML5 History mode
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/about',
      component: About,
    },
    {
      path: '/:pathMatch(.*)*',
      component: NotFound,
    },
  ],
});
```

### 3. Create App with RouterView

Use `RouterView` to render the matched component:

```tsx
// App.tsx
import { RouterLink, RouterView } from 'essor-router';
import { router } from './router';

function App() {
  return (
    <div>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
      
      <main>
        <RouterView router={router} />
      </main>
    </div>
  );
}

export default App;
```

### 4. Mount the App

```tsx
// main.tsx
import { createApp } from 'essor';
import App from './App';

createApp(App, '#app');
```

## Complete Example

Here's a complete single-file example:

```tsx
import { createApp } from 'essor';
import { RouterLink, RouterView, createRouter } from 'essor-router';

// Components
function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p>Welcome to essor-router!</p>
    </div>
  );
}

function About() {
  return (
    <div>
      <h1>About</h1>
      <p>This is the about page.</p>
    </div>
  );
}

function User() {
  return (
    <div>
      <h1>User Profile</h1>
    </div>
  );
}

// Router
const router = createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/user/:id', component: User },
  ],
});

// App
function App() {
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/user/123">User 123</RouterLink>
      </nav>
      
      <main style={{ padding: '1rem' }}>
        <RouterView router={router} />
      </main>
    </div>
  );
}

createApp(App, '#app');
```

## Using Composition API

Access route information in your components:

```tsx
import { useRoute, useRouter } from 'essor-router';

function User() {
  const router = useRouter();
  const route = useRoute();
  
  const goHome = () => {
    router.push('/');
  };
  
  return (
    <div>
      <h1>User Profile</h1>
      <p>User ID: {route.params.id}</p>
      <button onClick={goHome}>Go Home</button>
    </div>
  );
}
```

## History Modes

essor-router supports three history modes:

### HTML5 History Mode (Recommended)

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
});
```

Clean URLs like `/user/123`. Requires server configuration to handle client-side routing.

### Hash Mode

```tsx
const router = createRouter({
  history: 'hash',
  routes: [...],
});
```

URLs with hash like `/#/user/123`. Works without server configuration.

### Memory Mode

```tsx
const router = createRouter({
  history: 'memory',
  routes: [...],
});
```

No URL changes. Useful for SSR and testing.

## Next Steps

- Learn about [Route Configuration](/guide/essentials/route-configuration)
- Explore [Dynamic Route Matching](/guide/essentials/dynamic-matching)
- Set up [Navigation Guards](/guide/advanced/navigation-guards)
