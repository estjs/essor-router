# Scroll Behavior

Scroll behavior controls how the browser scroll position is managed during route navigation. `essor-router` provides a `scrollBehavior` callback that fires after navigation completes, giving you full control over scroll position restoration, anchor scrolling, and custom scroll logic.

## Overview

When navigating between routes, the browser's default behavior is to maintain the current scroll position. This often results in a poor UX - for example, navigating to a new page should typically scroll to the top, while pressing the back button should restore the previous scroll position.

The `scrollBehavior` option on `createRouter()` lets you define exactly how scrolling should work:

```tsx
import { createRouter } from 'essor-router'

const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior(to, from, savedPosition) {
    // return desired scroll position
  },
})
```

The callback is invoked **after** navigation completes (including after `nextTick`), so DOM updates from your route components have already been applied. It only runs in the browser - it is a no-op during SSR.

## Callback Signature

```tsx
type RouterScrollBehavior = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  savedPosition: { left: number; top: number; behavior?: ScrollBehavior } | null,
) => Awaitable<ScrollPosition | false | void>
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `to` | The target **RouteLocationNormalized** object - the route being navigated to |
| `from` | The source **RouteLocationNormalizedLoaded** object - the route being navigated away from |
| `savedPosition` | The saved scroll position from browser history, or `null` if no position was saved. Only populated for `pop` navigations (back/forward) and first navigation |

### Return Value

You can return:

| Return Type | Behavior |
|-------------|----------|
| `{ left, top, behavior? }` | Scroll to the given coordinates. `behavior` can be `'auto'` or `'smooth'` |
| `{ el: string \| Element, behavior?, top?, left? }` | Scroll to a DOM element. `el` can be a CSS selector or an Element reference |
| `false` | Cancel the scroll entirely |
| `void` / `undefined` | Do nothing (keep current scroll position) |
| `Promise<ScrollPosition>` | Async scroll - the router waits for the promise before scrolling |

### TypeScript Types

```tsx
import type { RouterScrollBehavior } from 'essor-router'

type ScrollPositionCoordinates = {
  behavior?: ScrollOptions['behavior']
  left?: number
  top?: number
}

type ScrollPositionElement = ScrollToOptions & {
  el: string | Element
}

type ScrollPosition = ScrollPositionCoordinates | ScrollPositionElement
```

## Common Patterns

### Scroll to Top on Every Navigation

The simplest and most common pattern:

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
})
```

### Scroll to Top with Smooth Behavior

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior() {
    return { top: 0, left: 0, behavior: 'smooth' }
  },
})
```

### Conditional Scroll to Top

Only scroll to top when navigating to a new route (not for hash changes on the same page):

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior(to, from) {
    if (to.path !== from.path) {
      return { top: 0, left: 0 }
    }
  },
})
```

### Save and Restore Position on Back Navigation

This is the classic scroll restoration pattern - scroll to top on push navigation, restore saved position on back/forward:

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})
```

`savedPosition` is populated automatically by the router. On `pop` navigations (browser back/forward), the router looks up the saved scroll position by key from its internal `Map<string, position>`. If a position was saved for the history entry, it is passed to your callback.

### Scroll to Hash Anchor

When navigating to a URL with a hash (like `/page#section-3`), you can scroll the targeted element into view:

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }

    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})
```

This pattern checks if the target route contains a hash fragment. If it does, the router scrolls the element matching that `#id` into view. For routes without a hash, it falls back to the save/restore logic.

### Scroll to a Specific Element

Instead of hash fragments, you can target any element by selector or reference:

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior(to, from, savedPosition) {
    if (to.name === 'home') {
      return {
        el: '#hero-section',
        top: 80, // offset for fixed header
        behavior: 'smooth',
      }
    }
    return { top: 0 }
  },
})
```

> [!NOTE]
> When using `el` with an ID selector like `#section`, pass it directly. For other CSS selectors (`.class`, `[attr]`), use `el: document.querySelector('.my-class')` to avoid a dev-mode warning.

## Async Scroll Behavior

The `scrollBehavior` callback can return a `Promise`. The router will await it before applying the scroll position. This is useful when you need to wait for async page content to finish rendering.

### Waiting for Data to Load

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  async scrollBehavior(to, from, savedPosition) {
    // Wait for a known element to appear in the DOM
    if (to.name === 'heavy-page') {
      await waitForElement('#content-loaded')
    }

    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }

    return { top: 0 }
  },
})

function waitForElement(selector: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve()
    }
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}
```

### Conditional Async Delays

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve) => {
      // Let async components mount first
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition)
        } else if (to.hash) {
          resolve({ el: to.hash, behavior: 'smooth' })
        } else {
          resolve({ top: 0 })
        }
      }, 0)
    })
  },
})
```

## Delayed Scroll (Waiting for Page Transitions)

When using page transition animations (CSS transitions, FLIP animations, etc.), you may need to delay scrolling until the animation completes:

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve) => {
      // Wait for the page transition to finish
      const transitionDuration = to.meta.transition === 'fade' ? 300 : 0

      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition)
        } else {
          resolve({ top: 0, behavior: 'smooth' })
        }
      }, transitionDuration)
    })
  },
})
```

## Practical Examples

### Complete Example: Production Scroll Behavior

A production-ready scroll behavior combining all common patterns:

```tsx
import { createRouter } from 'essor-router'
import type { RouterScrollBehavior } from 'essor-router'

const scrollBehavior: RouterScrollBehavior = (to, from, savedPosition) => {
  // Hash navigation: scroll to the anchor
  if (to.hash) {
    return {
      el: to.hash,
      behavior: 'smooth',
    }
  }

  // Back/forward navigation: restore saved position
  if (savedPosition) {
    return savedPosition
  }

  // Same route (query/hash change only): keep position
  if (to.path === from.path) {
    return
  }

  // New route navigation: scroll to top
  return { top: 0, left: 0 }
}

const router = createRouter({
  history: 'history',
  routes,
  scrollBehavior,
})
```

### Save/Restore Position with Route-Specific Rules

```tsx
const scrollPositions = new Map<string, number>()

const router = createRouter({
  history: 'history',
  routes: [...],
  scrollBehavior(to, from, savedPosition) {
    // Some routes should always start at the top
    if (to.meta.alwaysScrollToTop) {
      return { top: 0 }
    }

    // Restore saved position for back navigation
    if (savedPosition) {
      return savedPosition
    }

    // Scroll to top for new navigations
    return { top: 0 }
  },
})
```

With route configuration:

```tsx
const routes = [
  {
    path: '/long-list',
    component: LongList,
    meta: { alwaysScrollToTop: false },
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { alwaysScrollToTop: true },
  },
]
```

### Route Transition + Scroll Coordination

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
  async scrollBehavior(to, from, savedPosition) {
    // Handle scroll during route transitions
    if (from.meta.transition === 'slide' || to.meta.transition === 'slide') {
      await new Promise((r) => setTimeout(r, 350))
    }

    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})
```

## Tips and Caveats

### SSR Considerations

`scrollBehavior` is **never called during SSR** - the router checks `isBrowser` before invoking the callback. You don't need to add `if (typeof window === 'undefined')` guards.

```tsx
// No SSR guard needed - the router handles it internally
scrollBehavior(to, from, savedPosition) {
  // Always runs in the browser
  return { top: 0 }
}
```

### Async Components and Scroll Timing

The scroll behavior fires **after `nextTick`** (one microtask after navigation completes). This means sync components have mounted, but async/lazy components may not have resolved yet. If your page content depends on async components, use an async `scrollBehavior` that waits for the necessary DOM elements or a specific delay.

### Browser Compatibility

The router uses `window.scrollTo()` with `ScrollToOptions` when `'scrollBehavior' in document.documentElement.style` is truthy. In older browsers without smooth scroll support, it falls back to `window.scrollTo(x, y)` using concrete coordinates.

### Scroll Position Storage

Positions are saved per history key in an internal `Map<string, _ScrollPositionNormalized>` with a maximum of 50 entries. The key is computed as `history.state.position + fullPath`, ensuring unique entries per history step. When retrieved, the entry is deleted from the map (positions are consumed once).

### Preventing Scroll on Specific Navigations

Return `false` to completely cancel scroll handling:

```tsx
scrollBehavior(to, from, savedPosition) {
  if (to.query.noscroll === '1') {
    return false
  }
  return { top: 0 }
}
```

### Handling Fixed Headers with Element Scroll

When scrolling to an element, provide a `top` offset to account for a fixed header:

```tsx
scrollBehavior(to, from, savedPosition) {
  if (to.hash) {
    return {
      el: to.hash,
      top: 64, // height of fixed header
      behavior: 'smooth',
    }
  }
  return { top: 0 }
}
```

The `top` value in `ScrollPositionElement` acts as an **offset from the element's natural position**. Positive values shift the scroll downward (past the element), so use a positive `top` to leave room for a fixed header.

### Disabling Scroll Behavior

To opt out entirely, simply omit the `scrollBehavior` option:

```tsx
// No scrollBehavior - browser default scrolling is preserved
const router = createRouter({
  history: 'history',
  routes: [...],
})
```

## API Reference

### `RouterScrollBehavior`

```tsx
export interface RouterScrollBehavior {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    savedPosition: _ScrollPositionNormalized | null,
  ): Awaitable<ScrollPosition | false | void>
}
```

### `ScrollPosition`

```tsx
type ScrollPosition =
  | ScrollPositionCoordinates
  | ScrollPositionElement
```

### `ScrollPositionCoordinates`

```tsx
type ScrollPositionCoordinates = {
  behavior?: ScrollOptions['behavior']  // 'auto' | 'smooth'
  left?: number
  top?: number
}
```

### `ScrollPositionElement`

```tsx
type ScrollPositionElement = ScrollToOptions & {
  el: string | Element
  // also accepts behavior, left, top from ScrollToOptions
}
```

### `_ScrollPositionNormalized` (savedPosition)

```tsx
type _ScrollPositionNormalized = {
  behavior?: ScrollOptions['behavior']
  left: number
  top: number
}
```
