# TypeScript

essor-router 使用 TypeScript 编写，提供全面的类型定义。

## 扩展 RouteMeta

扩展 `RouteMeta` 接口以添加自定义元字段：

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

现在你可以获得元字段的类型检查：

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,  // ✅ 类型检查
      roles: ['admin'],    // ✅ 类型检查
      title: '管理',       // ✅ 类型检查
    },
  },
];
```

## 核心类型

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

### 导航守卫

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

## 使用示例

### 类型化路由参数

```tsx
interface UserParams {
  id: string;
}

function UserPage() {
  const route = useRoute();
  const params = route.params as UserParams;
  
  return <div>用户 ID：{params.id}</div>;
}
```

### 类型化导航

```tsx
const router = useRouter();

// 类型安全的导航
router.push({ name: 'user', params: { id: '123' } });
router.push({ path: '/user/123', query: { tab: 'profile' } });
```

### 类型化守卫

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
