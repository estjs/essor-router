# Programmatic Navigation

In addition to using `<RouterLink>` for declarative navigation, you can navigate programmatically using the router instance.

## Getting the Router Instance

Use the `useRouter` hook to access the router:

```tsx
import { useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  
  // Now you can use router.push(), router.replace(), etc.
}
```

## router.push()

Navigate to a new URL and add an entry to the history stack:

```tsx
// String path
router.push('/users');

// Object with path
router.push({ path: '/users' });

// Named route with params
router.push({ name: 'user', params: { id: '123' } });

// With query parameters
router.push({ path: '/search', query: { q: 'essor' } });

// With hash
router.push({ path: '/about', hash: '#team' });

// Complete example
router.push({
  name: 'user',
  params: { id: '123' },
  query: { tab: 'profile' },
  hash: '#bio',
});
```

## router.replace()

Navigate without adding a history entry (replaces the current entry):

```tsx
// String path
router.replace('/users');

// Object with path
router.replace({ path: '/users' });

// Or use the replace option with push
router.push({ path: '/users', replace: true });
```

Use `replace` when you don't want the user to be able to navigate back to the previous page.

## router.go()

Navigate through history by a relative position:

```tsx
// Go forward one entry
router.go(1);

// Go back one entry
router.go(-1);

// Go back two entries
router.go(-2);
```

## router.back() and router.forward()

Convenience methods for common navigation:

```tsx
// Same as router.go(-1)
router.back();

// Same as router.go(1)
router.forward();
```

## Navigation with State

Pass state data that won't appear in the URL:

```tsx
router.push({
  path: '/checkout',
  state: {
    fromCart: true,
    items: ['item1', 'item2'],
  },
});
```

Access the state in the target component:

```tsx
// The state is available in history.state
console.log(history.state);
```

## Handling Navigation Results

`router.push()` and `router.replace()` return a Promise:

```tsx
async function navigate() {
  try {
    await router.push('/users');
    console.log('Navigation successful');
  } catch (error) {
    console.error('Navigation failed:', error);
  }
}
```

### Navigation Failures

```tsx
import { NavigationFailureType, isNavigationFailure } from 'essor-router';

const result = await router.push('/users');

if (isNavigationFailure(result)) {
  // Navigation was prevented
  console.log('Navigation failed');
}

if (isNavigationFailure(result, NavigationFailureType.aborted)) {
  // Navigation was aborted by a guard
  console.log('Navigation aborted');
}

if (isNavigationFailure(result, NavigationFailureType.duplicated)) {
  // Already at the target location
  console.log('Already there');
}
```

## Force Navigation

Force navigation even if the target is the same as the current location:

```tsx
router.push({ path: '/users', force: true });
```

## Practical Examples

### Navigate After Form Submit

```tsx
function LoginForm() {
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const success = await login(credentials);
    
    if (success) {
      // Redirect to dashboard after login
      router.push('/dashboard');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Navigate with Confirmation

```tsx
function Editor() {
  const router = useRouter();
  
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('Discard changes?')) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  };
  
  return <button onClick={handleClose}>Close</button>;
}
```

### Redirect Based on Condition

```tsx
function ProtectedPage() {
  const router = useRouter();
  const route = useRoute();
  
  if (!isAuthenticated()) {
    // Redirect to login with return URL
    router.replace({
      path: '/login',
      query: { redirect: route.fullPath },
    });
    return null;
  }
  
  return <div>Protected Content</div>;
}
```

### Navigate Back with Fallback

```tsx
function BackButton() {
  const router = useRouter();
  
  const goBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to home
      router.push('/');
    }
  };
  
  return <button onClick={goBack}>Back</button>;
}
```

### Programmatic Navigation in Guards

```tsx
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    // Redirect to login
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});
```
