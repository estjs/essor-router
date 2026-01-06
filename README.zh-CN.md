<h1 align="center">essor-router</h1>

<div align="center">

![ci](https://img.shields.io/github/actions/workflow/status/estjs/essor-router/ci.yml?label=CI&logo=GitHub)
![license](https://img.shields.io/github/license/estjs/essor-router)
![version](https://img.shields.io/npm/v/essor-router)
![download](https://img.shields.io/npm/dm/essor-router)
![codecov](https://img.shields.io/codecov/c/github/estjs/essor-router)

</div>

[Essor](https://github.com/estjs/essor) 框架的官方路由库 - 一个轻量级、类型安全的路由解决方案。

[English](./README.md) | 简体中文

## 特性

- 🚀 **多种历史模式** - 支持 HTML5 History、Hash 和 Memory 模式
- 🎯 **类型安全** - 完整的 TypeScript 支持和全面的类型定义
- 🔗 **嵌套路由** - 支持深层嵌套的路由配置
- 🛡️ **导航守卫** - 全局、路由级别和组件内守卫
- 📦 **懒加载** - 支持异步组件加载和代码分割
- 🏷️ **命名路由和视图** - 命名路由和多命名视图支持
- 🔄 **动态路由** - 运行时添加/删除路由
- 📍 **路由参数** - 支持自定义正则表达式的动态路径段
- 🔀 **重定向和别名** - 灵活的路由重定向和别名功能

## 安装

```bash
# npm
npm install essor-router

# pnpm
pnpm add essor-router

# yarn
yarn add essor-router
```

## 快速开始

```tsx
import { createApp } from 'essor';
import { RouterLink, RouterView, createRouter } from 'essor-router';

// 定义组件
function Home() {
  return <div>首页</div>;
}

function About() {
  return <div>关于页面</div>;
}

// 创建路由实例
const router = createRouter({
  history: 'history', // 'history' | 'hash' | 'memory'
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ],
});

// 使用 RouterView 创建应用
function App() {
  return (
    <div>
      <nav>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
      <RouterView router={router} />
    </div>
  );
}

createApp(App, '#app');
```

## 文档

详细文档请访问 [docs](./docs) 目录或查看下面的示例。

### 核心概念

- [路由配置](#路由配置)
- [路由匹配](#路由匹配)
- [导航](#导航)
- [导航守卫](#导航守卫)
- [组合式 API](#组合式-api)

### 路由配置

```tsx
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'essor-router';

const router = createRouter({
  // 历史模式 - 选择其一：
  history: 'history',           // HTML5 History API（推荐）
  // history: 'hash',           // Hash 模式，适用于静态托管
  // history: 'memory',         // Memory 模式，适用于 SSR/测试
  
  // 或使用工厂函数获得更多控制：
  // history: createWebHistory('/base-path/'),
  // history: createWebHashHistory(),
  // history: createMemoryHistory(),
  
  routes: [
    // 基础路由
    { path: '/', component: Home },
    
    // 命名路由
    { path: '/user/:id', name: 'user', component: User },
    
    // 嵌套路由
    {
      path: '/dashboard',
      component: Dashboard,
      children: [
        { path: '', component: DashboardHome },
        { path: 'settings', component: DashboardSettings },
      ],
    },
    
    // 重定向
    { path: '/home', redirect: '/' },
    
    // 别名
    { path: '/users', component: Users, alias: '/people' },
    
    // 捕获所有 404
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
});
```

### 路由匹配

essor-router 支持强大的路径匹配和动态路径段：

```tsx
const routes = [
  // 动态路径段
  { path: '/user/:id', component: User },
  
  // 多个路径段
  { path: '/user/:userId/post/:postId', component: Post },
  
  // 可选路径段
  { path: '/user/:id?', component: User },
  
  // 可重复路径段
  { path: '/files/:path+', component: Files },
  
  // 可选可重复
  { path: '/files/:path*', component: Files },
  
  // 自定义正则
  { path: '/user/:id(\\d+)', component: User },
  
  // 捕获所有
  { path: '/:pathMatch(.*)*', component: NotFound },
];
```

### 导航

#### 声明式导航

```tsx
import { RouterLink } from 'essor-router';

// 字符串路径
<RouterLink to="/about">关于</RouterLink>

// 带路径的对象
<RouterLink to={{ path: '/user/123' }}>用户</RouterLink>

// 带参数的命名路由
<RouterLink to={{ name: 'user', params: { id: '123' } }}>用户</RouterLink>

// 带查询参数和哈希
<RouterLink to={{ path: '/search', query: { q: 'essor' }, hash: '#results' }}>
  搜索
</RouterLink>

// 替换而非推入
<RouterLink to="/about" replace>关于</RouterLink>

// 自定义激活类名
<RouterLink to="/about" activeClass="active" exactActiveClass="exact-active">
  关于
</RouterLink>
```

#### 编程式导航

```tsx
import { useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  
  // 导航到路径
  router.push('/about');
  
  // 使用对象导航
  router.push({ path: '/user/123' });
  
  // 命名路由
  router.push({ name: 'user', params: { id: '123' } });
  
  // 带查询参数
  router.push({ path: '/search', query: { q: 'essor' } });
  
  // 替换当前记录
  router.replace('/about');
  
  // 前进/后退
  router.back();
  router.forward();
  router.go(-2);
}
```

### 导航守卫

#### 全局守卫

```tsx
// 每次导航前
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});

// 解析前（在组件内守卫之后）
router.beforeResolve((to, from, next) => {
  next();
});

// 每次导航后
router.afterEach((to, from, failure) => {
  if (!failure) {
    analytics.track(to.path);
  }
});
```

#### 路由独享守卫

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: (to, from, next) => {
      if (!isAdmin()) {
        next('/forbidden');
      } else {
        next();
      }
    },
  },
];
```

#### 组件内守卫

```tsx
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'essor-router';

function Editor() {
  onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChanges()) {
      if (confirm('放弃更改？')) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });
  
  onBeforeRouteUpdate((to, from, next) => {
    // 当路由参数变化但组件被复用时调用
    next();
  });
  
  return <div>编辑器</div>;
}
```

### 组合式 API

```tsx
import { useRoute, useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  const route = useRoute();
  
  // 访问当前路由信息
  console.log(route.path);        // '/user/123'
  console.log(route.params);      // { id: '123' }
  console.log(route.query);       // { tab: 'profile' }
  console.log(route.hash);        // '#section'
  console.log(route.fullPath);    // '/user/123?tab=profile#section'
  console.log(route.name);        // 'user'
  console.log(route.meta);        // { requiresAuth: true }
  console.log(route.matched);     // 匹配的路由记录数组
  
  // 路由实例方法
  router.push('/new-path');
  router.replace('/new-path');
  router.back();
  router.forward();
  router.go(n);
  
  // 动态路由管理
  router.addRoute({ path: '/new', component: NewPage });
  router.removeRoute('routeName');
  router.hasRoute('routeName');
  router.getRoutes();
  
  return <div>当前路径：{route.path}</div>;
}
```

### 路由元信息

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      roles: ['admin'],
    },
  },
];

// 在守卫中访问
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 检查认证
  }
  next();
});

// 在组件中访问
function Admin() {
  const route = useRoute();
  console.log(route.meta.roles); // ['admin']
}
```

### 命名视图

```tsx
const routes = [
  {
    path: '/dashboard',
    components: {
      default: DashboardMain,
      sidebar: DashboardSidebar,
      header: DashboardHeader,
    },
  },
];

function Layout() {
  return (
    <div>
      <RouterView name="header" />
      <div class="content">
        <RouterView name="sidebar" />
        <RouterView /> {/* 默认视图 */}
      </div>
    </div>
  );
}
```

### 懒加载

```tsx
const routes = [
  {
    path: '/about',
    component: () => import('./pages/About'),
  },
];
```

### 错误处理

```tsx
import { NavigationFailureType, isNavigationFailure } from 'essor-router';

router.afterEach((to, from, failure) => {
  if (isNavigationFailure(failure)) {
    console.log('导航失败：', failure);
  }
  
  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    console.log('导航被中止');
  }
  
  if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    console.log('已在当前位置');
  }
});

// 全局错误处理
router.onError((error, to, from) => {
  console.error('路由错误：', error);
});
```

## API 参考

### createRouter(options)

创建路由实例。

| 选项 | 类型 | 描述 |
|------|------|------|
| `history` | `'history' \| 'hash' \| 'memory' \| RouterHistory` | 历史模式 |
| `routes` | `RouteRecordRaw[]` | 初始路由记录 |
| `base` | `string` | 基础 URL 路径 |
| `parseQuery` | `(query: string) => LocationQuery` | 自定义查询解析器 |
| `stringifyQuery` | `(query: LocationQueryRaw) => string` | 自定义查询序列化器 |
| `linkActiveClass` | `string` | RouterLink 默认激活类名 |
| `linkExactActiveClass` | `string` | RouterLink 默认精确激活类名 |

### 路由实例

| 属性/方法 | 描述 |
|-----------|------|
| `currentRoute` | 当前路由位置（Signal） |
| `options` | 路由选项 |
| `push(to)` | 导航到新位置 |
| `replace(to)` | 替换当前位置 |
| `back()` | 后退 |
| `forward()` | 前进 |
| `go(delta)` | 跳转到指定历史位置 |
| `beforeEach(guard)` | 添加全局前置守卫 |
| `beforeResolve(guard)` | 添加全局解析守卫 |
| `afterEach(hook)` | 添加全局后置钩子 |
| `onError(handler)` | 添加错误处理器 |
| `addRoute(route)` | 动态添加路由 |
| `removeRoute(name)` | 按名称删除路由 |
| `hasRoute(name)` | 检查路由是否存在 |
| `getRoutes()` | 获取所有路由记录 |
| `resolve(to)` | 解析路由位置 |
| `isReady()` | 路由准备就绪时解析的 Promise |

### 组件

#### RouterView

渲染当前路由匹配的组件。

```tsx
<RouterView 
  router={router}      // 路由实例（如果通过上下文提供则可选）
  name="default"       // 命名视图（默认：'default'）
  route={route}        // 覆盖要显示的路由
/>
```

#### RouterLink

创建导航链接。

```tsx
<RouterLink
  to="/path"                    // 目标位置
  replace={false}               // 使用 replace 而非 push
  activeClass="active"          // 激活时的类名
  exactActiveClass="exact"      // 精确激活时的类名
  custom={false}                // 禁用默认锚点渲染
/>
```

### 组合式函数

| 函数 | 描述 |
|------|------|
| `useRouter()` | 返回路由实例 |
| `useRoute()` | 返回当前路由 |
| `onBeforeRouteLeave(guard)` | 注册离开守卫 |
| `onBeforeRouteUpdate(guard)` | 注册更新守卫 |

## 示例

查看 [examples](./examples) 目录获取更多使用示例：

- [Basic](./examples/basic) - 简单路由设置
- [Use API](./examples/use-api) - 使用组合式 API
- [Router Link](./examples/router-link) - RouterLink 用法
- [Async Router](./examples/async-router) - 懒加载路由
- [Option Router](./examples/option-router) - 高级配置

## TypeScript

essor-router 使用 TypeScript 编写，提供完整的类型支持。你可以扩展 `RouteMeta` 接口来添加自定义元字段：

```typescript
// types.d.ts
import 'essor-router';

declare module 'essor-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
    title?: string;
  }
}
```

## 浏览器支持

essor-router 支持所有现代浏览器。使用 HTML5 History 模式时，请确保服务器已配置为处理客户端路由。

## 贡献

欢迎贡献！请在提交 PR 前阅读我们的[贡献指南](CONTRIBUTING.md)。

## 许可证

[MIT](./LICENSE) 许可证 © 2024-present [estjs](https://github.com/estjs)
