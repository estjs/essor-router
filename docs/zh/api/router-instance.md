# Router 实例

`createRouter()` 返回的路由器实例。

## 属性

### currentRoute

- **类型：** `Signal<RouteLocationNormalizedLoaded>`

当前路由位置，作为响应式 Signal：

```tsx
const router = useRouter();

// 访问当前路由
console.log(router.currentRoute.value.path);
console.log(router.currentRoute.value.params);
```

### options

- **类型：** `RouterOptions`

传递给 `createRouter()` 的原始选项：

```tsx
console.log(router.options.linkActiveClass);
```

### listening

- **类型：** `boolean`

路由器是否正在监听历史变化：

```tsx
// 禁用监听（对微前端有用）
router.listening = false;
```

## 导航方法

### push

导航到新位置：

```tsx
// 字符串路径
router.push('/users');

// 带路径的对象
router.push({ path: '/users' });

// 命名路由
router.push({ name: 'user', params: { id: '123' } });

// 带查询和哈希
router.push({
  path: '/search',
  query: { q: 'essor' },
  hash: '#results',
});
```

**返回：** `Promise<NavigationFailure | void | undefined>`

### replace

替换当前位置（不添加历史记录）：

```tsx
router.replace('/users');
router.replace({ path: '/users' });
```

**返回：** `Promise<NavigationFailure | void | undefined>`

### go

在历史记录中导航：

```tsx
router.go(1);   // 前进
router.go(-1);  // 后退
router.go(-2);  // 后退 2 条记录
```

### back

后退一条记录（等同于 `go(-1)`）：

```tsx
router.back();
```

### forward

前进一条记录（等同于 `go(1)`）：

```tsx
router.forward();
```

### preloadRoute

提前解析目标位置并加载其异步组件与路由数据钩子，但**不进行导航**。返回的 Promise 会在路由完全加载后 resolve，因此随后对同一位置的 `push()`/`replace()` 会瞬间完成。

```tsx
// 在用户点击之前预热 dashboard
await router.preloadRoute('/dashboard');
await router.preloadRoute({ name: 'user', params: { id: '123' } });
```

这是 `RouterLink` 的 [`prefetch`](./router-link#prefetch) 属性和 [`usePreloadRoute`](./composition-api#usepreloadroute) 组合式函数的命令式对应物。

**返回：** `Promise<RouteLocationNormalizedLoaded>`

## 路由管理

### addRoute

添加新路由：

```tsx
// 添加顶级路由
router.addRoute({
  path: '/new',
  name: 'new',
  component: NewPage,
});

// 添加子路由
router.addRoute('parent-name', {
  path: 'child',
  component: ChildPage,
});
```

**返回：** `() => void` - 删除路由的函数

### removeRoute

按名称删除路由：

```tsx
router.removeRoute('route-name');
```

### hasRoute

检查路由是否存在：

```tsx
if (router.hasRoute('admin')) {
  // 路由存在
}
```

**返回：** `boolean`

### getRoutes

获取所有路由记录：

```tsx
const routes = router.getRoutes();
routes.forEach(route => {
  console.log(route.path, route.name);
});
```

**返回：** `RouteRecord[]`

### clearRoutes

一次性移除所有已注册的路由：

```tsx
router.clearRoutes();
console.log(router.getRoutes().length); // 0
```

适用于整体替换路由表的场景（例如微前端交接）。清空后，请在下一次导航前用 `addRoute()` 注册新路由。

**返回：** `void`

### resolve

解析路由位置：

```tsx
const resolved = router.resolve('/user/123');
const resolved = router.resolve({ name: 'user', params: { id: '123' } });

console.log(resolved.href);      // '/user/123'
console.log(resolved.fullPath);  // '/user/123'
console.log(resolved.params);    // { id: '123' }
```

**返回：** `RouteLocation & { href: string }`

## 导航守卫

### beforeEach

添加全局前置守卫：

```tsx
const unregister = router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isLoggedIn()) {
    next('/login');
  } else {
    next();
  }
});

// 移除守卫
unregister();
```

**返回：** `() => void`

### beforeResolve

添加全局解析守卫：

```tsx
router.beforeResolve((to, from, next) => {
  // 在组件内守卫之后调用
  next();
});
```

**返回：** `() => void`

### afterEach

添加全局后置钩子：

```tsx
router.afterEach((to, from, failure) => {
  // 导航后调用
  analytics.track(to.path);
});
```

**返回：** `() => void`

## 错误处理

### onError

添加错误处理器：

```tsx
router.onError((error, to, from) => {
  console.error('路由错误：', error);
});
```

处理器会收到错误，以及发生错误时的导航对象：

```tsx
type ErrorListener = (
  error: Error,
  to: RouteLocationNormalized,        // 正在导航前往的目标
  from: RouteLocationNormalizedLoaded, // 离开的位置
) => void;
```

守卫、异步组件或路由数据钩子中抛出的错误都会转发到这里。导航**失败**（中止/取消/重复）**不是**错误——请用 [`isNavigationFailure`](#isnavigationfailure) 检查 `push()`/`replace()` 的返回值。

**返回：** `() => void`

## 就绪状态

### isReady

返回路由器就绪时解析的 Promise：

```tsx
await router.isReady();
console.log('路由器已就绪');
```

**返回：** `Promise<void>`

## 生命周期

### init

初始化路由器（由 RouterView 自动调用）：

```tsx
router.init();
```

### destroy

清理路由器：

```tsx
router.destroy();
```

## 预渲染与渲染模式

以下方法配合路由记录上的 `start` 字段（或 `defineStartRoute`），用于支持静态站点生成和按路由的渲染策略。

### getPrerenderPaths

返回所有启用了 `start.prerender` 的预渲染入口：

```tsx
const entries = router.getPrerenderPaths();
```

每个入口是一个 `PrerenderPathInfo`：

```tsx
interface PrerenderPathInfo {
  name: string | symbol | undefined; // 路由名称
  pathTemplate: string;              // 例如 '/users/:id'
  paths: string[];                   // 待渲染的具体路径
  meta: Record<string | number | symbol, any>;
}
```

静态路由会直接把自身路径放进 `paths`。动态路由需要通过 `start.prerenderPaths` 提供具体路径，否则会被跳过。

```tsx
{
  path: '/users/:id',
  start: {
    prerender: true,
    prerenderPaths: ['/users/1', '/users/2'],
  },
}
```

**返回：** `PrerenderPathInfo[]`

### getPrerenderPathsAsync

与 `getPrerenderPaths` 相同，但会 await 那些为异步函数的 `start.prerenderPaths`（例如从 CMS 获取 slug）：

```tsx
{
  path: '/posts/:slug',
  start: {
    prerender: true,
    prerenderPaths: async () => {
      const posts = await fetchAllPosts();
      return posts.map(p => `/posts/${p.slug}`);
    },
  },
}

const entries = await router.getPrerenderPathsAsync();
```

**返回：** `Promise<PrerenderPathInfo[]>`

### getRouteRenderMode

按名称返回某个路由解析后的渲染模式：

```tsx
const mode = router.getRouteRenderMode('user'); // 'csr' | 'ssr' | 'prerender'
```

| 模式 | 含义 |
|------|------|
| `'csr'` | 客户端渲染（默认） |
| `'ssr'` | 每次请求服务端渲染 |
| `'prerender'` | 构建时渲染为静态 HTML |

模式由路由的 `start` 配置推导而来。带 `start.prerender` 的路由解析为 `'prerender'`；可在构建流程中据此决定每个路由的产出方式。

**返回：** `RouteRenderMode`

## 导航失败

### isNavigationFailure

检查值是否为导航失败：

```tsx
import { NavigationFailureType, isNavigationFailure } from 'essor-router';

const result = await router.push('/path');

if (isNavigationFailure(result)) {
  console.log('导航失败');
}

if (isNavigationFailure(result, NavigationFailureType.aborted)) {
  console.log('导航被中止');
}

if (isNavigationFailure(result, NavigationFailureType.cancelled)) {
  console.log('导航被取消');
}

if (isNavigationFailure(result, NavigationFailureType.duplicated)) {
  console.log('已在当前位置');
}
```

### NavigationFailureType

```tsx
enum NavigationFailureType {
  aborted = 4,     // 守卫返回 false 或调用 next(false)
  cancelled = 8,   // 完成前开始了新导航
  duplicated = 16, // 已在目标位置
}
```

## 示例

```tsx
import { createRouter, isNavigationFailure, NavigationFailureType } from 'essor-router';

const router = createRouter({
  history: 'history',
  routes: [...],
});

// 全局守卫
router.beforeEach((to, from, next) => {
  console.log(`从 ${from.path} 导航到 ${to.path}`);
  next();
});

router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('导航失败：', failure);
  } else {
    document.title = to.meta.title || '我的应用';
  }
});

// 错误处理
router.onError((error) => {
  console.error('路由错误：', error);
});

// 导航
async function navigate() {
  const result = await router.push('/dashboard');
  
  if (isNavigationFailure(result, NavigationFailureType.aborted)) {
    console.log('导航被守卫阻止');
  }
}

// 等待就绪
router.isReady().then(() => {
  console.log('初始导航完成');
});
```
