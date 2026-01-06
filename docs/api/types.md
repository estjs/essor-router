# TypeScript

essor-router is written in TypeScript and provides comprehensive type definitions.

## Extending RouteMeta

Extend the `RouteMeta` interface to add custom meta fields:

```tsx
// types.d.ts
import 'essor-router';

declare module 'essor-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
    title?: string;
    transition?: string;
    layout?: 'default' | 'admin' | 'auth';
  }
}
```

Now you get type checking for meta fields:

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,  // ✅ Type checked
      roles: ['admin'],    // ✅ Type checked
      title: 'Admin',      // ✅ Type checked
    },
  },
];
```

## Core Types

### Router

```tsx
interface Router {
  readonly currentRoute: Signal<RouteLocationNormalizedLoaded>;
  readonly options: RouterOptions;
  listening: boolean;
  
  addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void;
  addRoute(route: RouteRecordRaw): () => void;
  removeRoute(name: RouteRecordName): void;
  hasRoute(name: RouteRecordName): boolean;
  getRoutes(): RouteRecord[];
  
  resolve(to: RouteLocationRaw, currentLocation?: RouteLocationNormalizedLoaded): RouteLocation & { href: string };
  
  push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
  replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>;
  back(): void;
  forward(): void;
  go(delta: number): void;
  
  beforeEach(guard: NavigationGuardWithThis<undefined>): () => void;
  beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void;
  afterEach(guard: NavigationHookAfter): () => void;
  onError(handler: ErrorListener): () => void;
  
  isReady(): Promise<void>;
  init(): void;
  destroy(): void;
}
```

### RouterOptions

```tsx
interface RouterOptions {
  history: 'history' | 'hash' | 'memory' | RouterHistory;
  routes: RouteRecordRaw[];
  base?: string;
  parseQuery?: (query: string) => LocationQuery;
  stringifyQuery?: (query: LocationQueryRaw) => string;
  linkActiveClass?: string;
  linkExactActiveClass?: string;
  strict?: boolean;
  sensitive?: boolean;
  end?: boolean;
}
```

### RouteRecordRaw

```tsx
type RouteRecordRaw =
  | RouteRecordSingleView
  | RouteRecordSingleViewWithChildren
  | RouteRecordMultipleViews
  | RouteRecordMultipleViewsWithChildren
  | RouteRecordRedirect;

interface RouteRecordBase {
  path: string;
  name?: RouteRecordName;
  redirect?: RouteRecordRedirectOption;
  alias?: string | string[];
  meta?: RouteMeta;
  beforeEnter?: NavigationGuard | NavigationGuard[];
  beforeLeave?: NavigationGuard | NavigationGuard[];
  props?: RouteRecordProps;
  children?: RouteRecordRaw[];
  sensitive?: boolean;
  strict?: boolean;
}

interface RouteRecordSingleView extends RouteRecordBase {
  component: RouteComponent;
  components?: never;
}

interface RouteRecordMultipleViews extends RouteRecordBase {
  components: Record<string, RouteComponent>;
  component?: never;
}
```

### RouteLocation

```tsx
interface RouteLocationBase {
  name: RouteRecordName | null | undefined;
  path: string;
  fullPath: string;
  query: LocationQuery;
  hash: string;
  params: RouteParams;
  meta: RouteMeta;
  redirectedFrom: RouteLocation | undefined;
  href: string;
}

interface RouteLocation extends RouteLocationBase {
  matched: RouteRecord[];
}

interface RouteLocationNormalized extends RouteLocationBase {
  matched: RouteRecordNormalized[];
}

interface RouteLocationNormalizedLoaded extends RouteLocationBase {
  matched: RouteLocationMatched[];
}
```

### RouteLocationRaw

```tsx
type RouteLocationRaw = 
  | string 
  | RouteLocationPathRaw 
  | RouteLocationNamedRaw;

interface RouteLocationPathRaw {
  path: string;
  query?: LocationQueryRaw;
  hash?: string;
  replace?: boolean;
  force?: boolean;
  state?: HistoryState;
}

interface RouteLocationNamedRaw {
  name: RouteRecordName;
  params?: RouteParamsRaw;
  query?: LocationQueryRaw;
  hash?: string;
  replace?: boolean;
  force?: boolean;
  state?: HistoryState;
}
```

### Navigation Guards

```tsx
interface NavigationGuard {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): NavigationGuardReturn | Promise<NavigationGuardReturn>;
}

interface NavigationGuardNext {
  (): void;
  (error: Error): void;
  (location: RouteLocationRaw): void;
  (valid: boolean): void;
}

type NavigationGuardReturn = void | Error | RouteLocationRaw | boolean;

interface NavigationHookAfter {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    failure?: NavigationFailure | void
  ): void;
}
```

### NavigationFailure

```tsx
interface NavigationFailure extends Error {
  type: NavigationFailureType;
  from: RouteLocationNormalized;
  to: RouteLocationNormalized;
}

enum NavigationFailureType {
  aborted = 4,
  cancelled = 8,
  duplicated = 16,
}
```

### RouterHistory

```tsx
interface RouterHistory {
  readonly base: string;
  readonly location: string;
  readonly state: HistoryState;
  
  push(to: string, data?: HistoryState): void;
  replace(to: string, data?: HistoryState): void;
  go(delta: number, triggerListeners?: boolean): void;
  listen(callback: NavigationCallback): () => void;
  createHref(location: string): string;
  destroy(): void;
}
```

### Query Types

```tsx
type LocationQueryValue = string | null;
type LocationQueryValueRaw = LocationQueryValue | number | undefined;
type LocationQuery = Record<string, LocationQueryValue | LocationQueryValue[]>;
type LocationQueryRaw = Record<string, LocationQueryValueRaw | LocationQueryValueRaw[]>;
```

### Params Types

```tsx
type RouteParamValue = string;
type RouteParamValueRaw = RouteParamValue | number | null | undefined;
type RouteParams = Record<string, RouteParamValue | RouteParamValue[]>;
type RouteParamsRaw = Record<string, RouteParamValueRaw | RouteParamValueRaw[]>;
```

## Type Utilities

### RouteRecordName

```tsx
type RouteRecordName = string | symbol;
```

### RouteMeta

```tsx
interface RouteMeta extends Record<string | number | symbol, any> {}
```

### RouteComponent

```tsx
type RouteComponent = any; // Essor component
type RawRouteComponent = RouteComponent | (() => Promise<RouteComponent>);
```

## Usage Examples

### Typed Route Params

```tsx
interface UserParams {
  id: string;
}

function UserPage() {
  const route = useRoute();
  const params = route.params as UserParams;
  
  return <div>User ID: {params.id}</div>;
}
```

### Typed Navigation

```tsx
const router = useRouter();

// Type-safe navigation
router.push({ name: 'user', params: { id: '123' } });
router.push({ path: '/user/123', query: { tab: 'profile' } });
```

### Typed Guards

```tsx
const guard: NavigationGuard = (to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
};

router.beforeEach(guard);
```
