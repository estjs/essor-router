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

**返回：** `() => void`

## 就绪状态

### isReady

返回路由器就绪时解析的 Promise：

```tsx
await router.isReady();
console.log('路由器已就绪');
```

**返回：** `Promise<void>`

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
