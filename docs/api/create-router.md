# createRouter

Creates a router instance.

## Signature

```tsx
function createRouter(options: RouterOptions): Router
```

## Options

### history

- **Type:** `'history' | 'hash' | 'memory' | RouterHistory`
- **Required:** Yes

The history mode to use:

```tsx
// String shorthand
// Or use factory functions
import { createMemoryHistory, createWebHashHistory, createWebHistory } from 'essor-router';

createRouter({
  history: 'history', // HTML5 History
  // history: 'hash',  // Hash mode
  // history: 'memory', // Memory mode
  routes: [],
});

createRouter({
  history: createWebHistory('/base/'),
  routes: [],
});
```

### routes

- **Type:** `RouteRecordRaw[]`
- **Required:** No (default `[]`)

Initial array of route records:

```tsx
createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ],
});
```

When `resolver` is supplied the records are normally provided through it
and `routes` can be omitted entirely. If both are passed, `routes` is
still consumed by the runtime matcher used for `addRoute`, `removeRoute`,
`hasRoute`, `getRoutes`, and prerender path collection — `resolver` only
takes over path matching.

### resolver

- **Type:** `FixedRouteResolver`
- **Required:** No

A prebuilt resolver generated at build time by `unplugin-essor-router`
and exposed via the virtual module `essor-router/auto-resolver`. Pass it
to delegate path resolution to compiled lookup tables and skip the
ranked runtime matcher on every navigation:

```tsx
import { resolver } from 'essor-router/auto-resolver';
import { createRouter, createWebHistory } from 'essor-router';

const router = createRouter({
  history: createWebHistory(),
  resolver,
});
```

You can also build a resolver by hand with `createFixedResolver()` for
SSR or testing scenarios — see the
[file-based routing guide](/guide/advanced/file-based-routing-unplugin)
for details.

### base

- **Type:** `string`
- **Default:** `'/'`

Base URL for all routes:

```tsx
createRouter({
  history: 'history',
  base: '/app/',
  routes: [],
});
```

### parseQuery

- **Type:** `(query: string) => LocationQuery`
- **Default:** Built-in parser

Custom query string parser:

```tsx
import qs from 'qs';

createRouter({
  history: 'history',
  parseQuery: qs.parse,
  routes: [],
});
```

### stringifyQuery

- **Type:** `(query: LocationQueryRaw) => string`
- **Default:** Built-in stringifier

Custom query string stringifier:

```tsx
import qs from 'qs';

createRouter({
  history: 'history',
  stringifyQuery: qs.stringify,
  routes: [],
});
```

### linkActiveClass

- **Type:** `string`
- **Default:** `'router-link-active'`

Default class for active RouterLink:

```tsx
createRouter({
  history: 'history',
  linkActiveClass: 'active',
  routes: [],
});
```

### linkExactActiveClass

- **Type:** `string`
- **Default:** `'router-link-exact-active'`

Default class for exactly active RouterLink:

```tsx
createRouter({
  history: 'history',
  linkExactActiveClass: 'exact-active',
  routes: [],
});
```

### strict

- **Type:** `boolean`
- **Default:** `false`

Enable strict path matching (trailing slash matters):

```tsx
createRouter({
  history: 'history',
  strict: true,
  routes: [],
});
```

### sensitive

- **Type:** `boolean`
- **Default:** `false`

Enable case-sensitive path matching:

```tsx
createRouter({
  history: 'history',
  sensitive: true,
  routes: [],
});
```

## History Factory Functions

### createWebHistory

Creates an HTML5 history:

```tsx
import { createWebHistory } from 'essor-router';

const history = createWebHistory();
const history = createWebHistory('/base/');
```

### createWebHashHistory

Creates a hash-based history:

```tsx
import { createWebHashHistory } from 'essor-router';

const history = createWebHashHistory();
const history = createWebHashHistory('/base/');
```

### createMemoryHistory

Creates an in-memory history (no URL changes):

```tsx
import { createMemoryHistory } from 'essor-router';

const history = createMemoryHistory();
const history = createMemoryHistory('/base/');
```

## Route Record

### RouteRecordRaw

```tsx
interface RouteRecordRaw {
  path: string;
  name?: string;
  component?: Component;
  components?: Record<string, Component>;
  redirect?: string | Location | Function;
  alias?: string | string[];
  children?: RouteRecordRaw[];
  beforeEnter?: NavigationGuard | NavigationGuard[];
  beforeLeave?: NavigationGuard | NavigationGuard[];
  meta?: RouteMeta;
  props?: boolean | object | Function;
  sensitive?: boolean;
  strict?: boolean;
}
```

## Example

```tsx
import { createRouter, createWebHistory } from 'essor-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { title: 'Home' },
    },
    {
      path: '/user/:id',
      name: 'user',
      component: User,
      props: true,
      children: [
        { path: '', component: UserHome },
        { path: 'profile', component: UserProfile },
      ],
    },
    {
      path: '/admin',
      component: Admin,
      beforeEnter: (to, from, next) => {
        if (!isAdmin()) next('/forbidden');
        else next();
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
    },
  ],
  linkActiveClass: 'active',
  linkExactActiveClass: 'exact-active',
});

export default router;
```
