# RouterLink

The `RouterLink` component creates navigation links.

## Basic Usage

```tsx
import { RouterLink } from 'essor-router';

<RouterLink to="/about">About</RouterLink>
```

## Props

### to

- **Type:** `string | RouteLocationRaw`
- **Required:** Yes

The target location:

```tsx
// String path
<RouterLink to="/about">About</RouterLink>

// Object with path
<RouterLink to={{ path: '/user/123' }}>User</RouterLink>

// Named route
<RouterLink to={{ name: 'user', params: { id: '123' } }}>User</RouterLink>

// With query
<RouterLink to={{ path: '/search', query: { q: 'essor' } }}>Search</RouterLink>

// With hash
<RouterLink to={{ path: '/about', hash: '#team' }}>Team</RouterLink>
```

### replace

- **Type:** `boolean`
- **Default:** `false`

Use `router.replace()` instead of `router.push()`:

```tsx
<RouterLink to="/about" replace>About</RouterLink>
```

### activeClass

- **Type:** `string`
- **Default:** `'router-link-active'`

Class applied when the link is active:

```tsx
<RouterLink to="/about" activeClass="active">About</RouterLink>
```

### exactActiveClass

- **Type:** `string`
- **Default:** `'router-link-exact-active'`

Class applied when the link is exactly active:

```tsx
<RouterLink to="/about" exactActiveClass="exact-active">About</RouterLink>
```

### custom

- **Type:** `boolean`
- **Default:** `false`

Don't render an anchor tag, just the children:

```tsx
<RouterLink to="/about" custom>
  {/* Render your own element */}
  <button>About</button>
</RouterLink>
```

### ariaCurrentValue

- **Type:** `'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'`
- **Default:** `'page'`

Value for `aria-current` when exactly active:

```tsx
<RouterLink to="/about" ariaCurrentValue="page">About</RouterLink>
```

### viewTransition

- **Type:** `boolean`
- **Default:** `false`

Use View Transitions API when navigating:

```tsx
<RouterLink to="/about" viewTransition>About</RouterLink>
```

### class

- **Type:** `string`
- **Required:** No

Additional CSS class:

```tsx
<RouterLink to="/about" class="nav-link">About</RouterLink>
```

### children

- **Type:** `ReactNode`
- **Required:** No

Link content:

```tsx
<RouterLink to="/about">
  <Icon name="info" />
  About Us
</RouterLink>
```

## Active State

RouterLink automatically applies active classes based on the current route:

### Active (Partial Match)

Applied when the current route starts with the link's path:

```tsx
// Current route: /user/123/profile
<RouterLink to="/user/123">User</RouterLink>
// Has class: router-link-active
```

### Exact Active (Exact Match)

Applied when the current route exactly matches the link's path:

```tsx
// Current route: /user/123
<RouterLink to="/user/123">User</RouterLink>
// Has classes: router-link-active router-link-exact-active
```

## Styling

```css
/* Default active class */
.router-link-active {
  color: blue;
}

/* Default exact active class */
.router-link-exact-active {
  font-weight: bold;
}

/* Custom classes */
.nav-link.active {
  background-color: #eee;
}

.nav-link.exact-active {
  border-bottom: 2px solid blue;
}
```

## Examples

### Navigation Menu

```tsx
function Navigation() {
  return (
    <nav>
      <RouterLink to="/" exactActiveClass="active">
        Home
      </RouterLink>
      <RouterLink to="/about" activeClass="active">
        About
      </RouterLink>
      <RouterLink to="/contact" activeClass="active">
        Contact
      </RouterLink>
    </nav>
  );
}
```

### With Icons

```tsx
<RouterLink to="/settings" class="nav-item">
  <Icon name="settings" />
  <span>Settings</span>
</RouterLink>
```

### Button Style

```tsx
<RouterLink to="/signup" class="btn btn-primary">
  Sign Up
</RouterLink>
```

### Custom Rendering

```tsx
<RouterLink to="/about" custom>
  <button class="custom-button">
    Go to About
  </button>
</RouterLink>
```

### With Query Parameters

```tsx
<RouterLink 
  to={{ 
    path: '/products', 
    query: { category: 'electronics', sort: 'price' } 
  }}
>
  Electronics
</RouterLink>
```

### Named Route with Params

```tsx
<RouterLink 
  to={{ 
    name: 'user-profile', 
    params: { userId: '123' } 
  }}
>
  View Profile
</RouterLink>
```

### Programmatic Active Check

```tsx
function NavLink({ to, children }) {
  const route = useRoute();
  const isActive = route.path.startsWith(to);
  
  return (
    <RouterLink 
      to={to} 
      class={`nav-link ${isActive ? 'active' : ''}`}
    >
      {children}
    </RouterLink>
  );
}
```

## Accessibility

RouterLink automatically handles accessibility:

- Renders as an `<a>` element by default
- Sets `aria-current="page"` when exactly active
- Handles keyboard navigation
- Prevents default on click for SPA navigation
