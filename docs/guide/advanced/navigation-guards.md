# Navigation Guards

Navigation guards allow you to control navigation by redirecting, canceling, or modifying the navigation.

## Global Guards

### beforeEach

Called before every navigation. Use it for authentication, logging, etc.

```tsx
router.beforeEach((to, from, next) => {
  // Check authentication
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});
```

### beforeResolve

Called after in-component guards and async route components are resolved.

```tsx
router.beforeResolve((to, from, next) => {
  // All components have been loaded
  next();
});
```

### afterEach

Called after navigation is confirmed. Cannot affect the navigation.

```tsx
router.afterEach((to, from, failure) => {
  // Log page views
  analytics.trackPageView(to.fullPath);
  
  // Update document title
  document.title = to.meta.title || 'My App';
  
  // Check for navigation failures
  if (failure) {
    console.error('Navigation failed:', failure);
  }
});
```

## Per-Route Guards

### beforeEnter

Defined directly on the route configuration:

```tsx
const routes = [
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
  },
];
```

### Multiple Guards

You can pass an array of guards:

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: [checkAuth, checkAdmin, logAccess],
  },
];

function checkAuth(to, from, next) {
  if (!isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
}

function checkAdmin(to, from, next) {
  if (!isAdmin()) {
    next('/forbidden');
  } else {
    next();
  }
}

function logAccess(to, from, next) {
  console.log(`Admin access: ${to.path}`);
  next();
}
```

### beforeLeave

Called when leaving a route:

```tsx
const routes = [
  {
    path: '/editor',
    component: Editor,
    beforeLeave: (to, from, next) => {
      if (hasUnsavedChanges()) {
        if (confirm('Discard unsaved changes?')) {
          next();
        } else {
          next(false);
        }
      } else {
        next();
      }
    },
  },
];
```

## In-Component Guards

### onBeforeRouteLeave

Called when the component is about to be navigated away from:

```tsx
import { onBeforeRouteLeave } from 'essor-router';

function Editor() {
  const hasChanges = signal(false);
  
  onBeforeRouteLeave((to, from, next) => {
    if (hasChanges.value) {
      const answer = confirm('You have unsaved changes. Leave anyway?');
      if (answer) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });
  
  return <div>Editor</div>;
}
```

### onBeforeRouteUpdate

Called when the route changes but the component is reused:

```tsx
import { onBeforeRouteUpdate } from 'essor-router';

function User() {
  const route = useRoute();
  const userData = signal(null);
  
  onBeforeRouteUpdate(async (to, from, next) => {
    // Fetch new user data when ID changes
    if (to.params.id !== from.params.id) {
      userData.value = await fetchUser(to.params.id);
    }
    next();
  });
  
  return <div>User: {userData.value?.name}</div>;
}
```

## Guard Arguments

### to

The target route location:

```tsx
router.beforeEach((to, from, next) => {
  console.log(to.path);       // '/user/123'
  console.log(to.params);     // { id: '123' }
  console.log(to.query);      // { tab: 'profile' }
  console.log(to.hash);       // '#bio'
  console.log(to.fullPath);   // '/user/123?tab=profile#bio'
  console.log(to.name);       // 'user'
  console.log(to.meta);       // { requiresAuth: true }
  console.log(to.matched);    // Array of matched route records
  next();
});
```

### from

The current route location (same structure as `to`).

### next

Function to resolve the guard:

```tsx
// Proceed with navigation
next();

// Cancel navigation
next(false);

// Redirect to a different location
next('/login');
next({ path: '/login' });
next({ name: 'login', query: { redirect: to.fullPath } });

// Abort with an error
next(new Error('Navigation failed'));
```

## Guard Resolution Flow

```
Navigation Triggered
        │
        ▼
┌───────────────────┐
│ beforeRouteLeave  │ (in deactivated components)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   beforeEach      │ (global)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ beforeRouteUpdate │ (in reused components)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   beforeEnter     │ (in route config)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Resolve async     │ (route components)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ beforeRouteEnter  │ (in activated components)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  beforeResolve    │ (global)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Navigation        │
│ Confirmed         │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│    afterEach      │ (global)
└───────────────────┘
```

## Practical Examples

### Authentication Guard

```tsx
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isLoggedIn = !!localStorage.getItem('token');
  
  if (requiresAuth && !isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  } else {
    next();
  }
});
```

### Role-Based Access

```tsx
router.beforeEach((to, from, next) => {
  const requiredRoles = to.meta.roles;
  
  if (requiredRoles) {
    const userRoles = getUserRoles();
    const hasAccess = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasAccess) {
      next('/forbidden');
      return;
    }
  }
  
  next();
});
```

### Loading Indicator

```tsx
router.beforeEach((to, from, next) => {
  showLoadingIndicator();
  next();
});

router.afterEach(() => {
  hideLoadingIndicator();
});
```

### Page Title

```tsx
router.afterEach((to) => {
  const title = to.meta.title;
  document.title = title ? `${title} - My App` : 'My App';
});
```

### Scroll Behavior

```tsx
router.afterEach((to, from) => {
  if (to.hash) {
    const element = document.querySelector(to.hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  } else if (to.path !== from.path) {
    window.scrollTo(0, 0);
  }
});
```

## Error Handling

```tsx
router.onError((error, to, from) => {
  console.error('Router error:', error);
  
  // Report to error tracking service
  errorTracker.captureException(error, {
    extra: {
      to: to.fullPath,
      from: from.fullPath,
    },
  });
});
```
