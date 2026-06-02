# RouterLink

The `RouterLink` component creates navigation links.

## Basic Usage

```tsx
import { RouterLink } from 'essor-router';

<RouterLink to="/about">About</RouterLink>
```

## Props

### to

- **Type:** `string | RouteLocationRaw | (() => RouteLocationRaw)`
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

You can also pass a getter for reactive targets:

```tsx
const $to = signal('/about')
<RouterLink to={() => $to.value}>Dynamic</RouterLink>
```

Note: In JSX, `$`-prefixed signals are transformed to `.value` reads. If you pass `to={$to}` in JSX, it becomes a static value. Use a getter for reactive `to` updates.

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

If not provided, `aria-current="page"` is applied when the link is exact active.

### viewTransition

- **Type:** `boolean`
- **Default:** `false`

Use View Transitions API when navigating:

```tsx
<RouterLink to="/about" viewTransition>About</RouterLink>
```

### prefetch

- **Type:** `'intent' | 'render' | 'viewport' | false`
- **Default:** `'intent'` (or the matched route's `start.preload`, if set)

Preload the target route's async components and data ahead of navigation, so the click feels instant. The value selects *when* preloading is triggered:

| Mode | Preloads when… | Best for |
|------|----------------|----------|
| `'intent'` | the user hovers, focuses, or touches the link (intent to click) | most links — cheap, well-targeted |
| `'render'` | the link mounts | a small number of high-confidence next steps |
| `'viewport'` | the link scrolls into the viewport (via `IntersectionObserver`) | long lists / feeds |
| `false` | never — disables preloading | links that are rarely followed |

```tsx
// Default (intent): preloads on hover/focus/touch — no prop needed
<RouterLink to="/dashboard">Dashboard</RouterLink>

// Preload as soon as the link is visible
<RouterLink to="/article/1" prefetch="viewport">Read more</RouterLink>

// Opt out
<RouterLink to="/rarely-visited" prefetch={false}>Archive</RouterLink>
```

When the prop is omitted, the mode is taken from the matched route's `start.preload` and falls back to `'intent'` — so links preload on intent **by default**. Set `prefetch={false}` to opt a link out.

Preloading only runs in the browser and never blocks rendering; failures are swallowed silently. Each link preloads at most once. When `IntersectionObserver` is unavailable, `'viewport'` falls back to preloading immediately.

For imperative control, use [`router.preloadRoute()`](./router-instance#preloadroute) or [`usePreloadRoute`](./composition-api#usepreloadroute).

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

## useLink

`useLink` exposes the same logic that powers `RouterLink` so you can build fully custom link components. It accepts the same props as `RouterLink` and returns reactive link state plus a `navigate` handler.

### Signature

```tsx
function useLink(props: RouterLinkProps): UseLinkReturn

interface UseLinkReturn {
  route: ReadonlyValue<RouteLocationNormalized>; // resolved target route
  href: ReadonlyValue<string>;                   // resolved href
  isActive: ReadonlyValue<boolean>;              // partial (prefix) match
  isExactActive: ReadonlyValue<boolean>;         // exact match
  navigate(e?: MouseEvent): Promise<void | NavigationFailure>;
}
```

### Usage

```tsx
import { useLink } from 'essor-router';

function NavButton(props) {
  const { href, isActive, navigate } = useLink(props);

  return (
    <button
      class={isActive.value ? 'active' : ''}
      onClick={navigate}
    >
      {props.children}
    </button>
  );
}

// <NavButton to="/about">About</NavButton>
```

`navigate` already guards modifier-key and right-clicks the same way `RouterLink` does, so it is safe to wire directly to `onClick`. Pair it with the `custom` prop on `RouterLink` if you only need to override rendering, or reach for `useLink` when you want full control over the element and behavior.

## Accessibility

RouterLink automatically handles accessibility:

- Renders as an `<a>` element by default
- Sets `aria-current="page"` when exactly active
- Handles keyboard navigation
- Prevents default on click for SPA navigation
