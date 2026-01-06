# 动态路由匹配

动态路由匹配允许你匹配 URL 路径中带有可变部分的路由。

## 基础动态路径段

使用 `:paramName` 定义动态路径段：

```tsx
const routes = [
  { path: '/user/:id', component: User },
];
```

这会匹配 `/user/123`、`/user/abc` 等。值可以通过 `route.params.id` 访问。

### 访问参数

```tsx
import { useRoute } from 'essor-router';

function User() {
  const route = useRoute();
  
  return <div>用户 ID：{route.params.id}</div>;
}
```

## 多个动态路径段

你可以在单个路由中使用多个动态路径段：

```tsx
const routes = [
  { path: '/user/:userId/post/:postId', component: Post },
];
```

| 模式 | 匹配路径 | params |
|------|----------|--------|
| `/user/:userId/post/:postId` | `/user/123/post/456` | `{ userId: '123', postId: '456' }` |

## 可选参数

添加 `?` 使参数可选：

```tsx
const routes = [
  { path: '/user/:id?', component: User },
];
```

| 模式 | 匹配路径 | params |
|------|----------|--------|
| `/user/:id?` | `/user` | `{}` |
| `/user/:id?` | `/user/123` | `{ id: '123' }` |

## 可重复参数

使用 `+` 匹配一个或多个路径段，使用 `*` 匹配零个或多个：

```tsx
const routes = [
  // 匹配 /files/a, /files/a/b, /files/a/b/c 等
  { path: '/files/:path+', component: Files },
  
  // 匹配 /files, /files/a, /files/a/b 等
  { path: '/docs/:path*', component: Docs },
];
```

| 模式 | 匹配路径 | params |
|------|----------|--------|
| `/files/:path+` | `/files/a/b/c` | `{ path: ['a', 'b', 'c'] }` |
| `/docs/:path*` | `/docs` | `{ path: [] }` |
| `/docs/:path*` | `/docs/a/b` | `{ path: ['a', 'b'] }` |

## 自定义正则

在括号中添加自定义正则模式：

```tsx
const routes = [
  // 只匹配数字 ID
  { path: '/user/:id(\\d+)', component: User },
  
  // 只匹配特定值
  { path: '/order/:status(pending|completed|cancelled)', component: Order },
];
```

| 模式 | 匹配路径 | 不匹配 |
|------|----------|--------|
| `/user/:id(\\d+)` | `/user/123` | `/user/abc` |
| `/order/:status(pending\|completed)` | `/order/pending` | `/order/unknown` |

## 捕获所有路由

使用 `(.*)` 匹配任意路径：

```tsx
const routes = [
  // 用于 404 的捕获所有路由
  { path: '/:pathMatch(.*)*', component: NotFound },
];
```

`pathMatch` 参数将包含匹配的路径段数组。

## 响应参数变化

当在使用相同组件的路由之间导航时（例如从 `/user/1` 到 `/user/2`），组件会被复用。使用 `onBeforeRouteUpdate` 来响应变化：

```tsx
import { onBeforeRouteUpdate, useRoute } from 'essor-router';

function User() {
  const route = useRoute();
  
  onBeforeRouteUpdate((to, from, next) => {
    // 响应路由变化
    console.log(`用户从 ${from.params.id} 变为 ${to.params.id}`);
    next();
  });
  
  return <div>用户 ID：{route.params.id}</div>;
}
```

## 示例

### 博客文章路由

```tsx
const routes = [
  {
    path: '/blog/:year(\\d{4})/:month(\\d{2})/:slug',
    component: BlogPost,
  },
];

// 匹配：/blog/2024/01/my-post
// params: { year: '2024', month: '01', slug: 'my-post' }
```

### 文件浏览器路由

```tsx
const routes = [
  {
    path: '/files/:path*',
    component: FileBrowser,
  },
];

// 匹配：/files/documents/reports/2024
// params: { path: ['documents', 'reports', '2024'] }
```
