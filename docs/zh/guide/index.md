# 介绍

essor-router 是 [Essor](https://github.com/estjs/essor) 框架的官方路由库。它提供了一个强大而灵活的路由解决方案，并提供完整的 TypeScript 支持。

## 为什么选择 essor-router？

构建单页应用（SPA）需要一个强大的路由解决方案来处理：

- **URL 管理**：将 URL 映射到组件并管理浏览器历史
- **导航控制**：守卫路由并根据条件控制访问
- **代码组织**：使用嵌套路由和懒加载来组织应用结构
- **类型安全**：使用 TypeScript 在编译时捕获路由错误

essor-router 满足所有这些需求，同时保持简单直观的 API。

## 特性

### 多种历史模式

选择适合你部署方式的历史模式：

- **HTML5 History 模式**：干净的 URL，如 `/user/123`（需要服务器配置）
- **Hash 模式**：带哈希的 URL，如 `/#/user/123`（无需配置）
- **Memory 模式**：不改变 URL，适用于 SSR 和测试

### 强大的路由匹配

使用动态路径段、可选参数和自定义模式定义路由：

```tsx
const routes = [
  { path: '/user/:id', component: User },           // 动态路径段
  { path: '/user/:id?', component: User },          // 可选路径段
  { path: '/files/:path+', component: Files },      // 一个或多个路径段
  { path: '/user/:id(\\d+)', component: User },     // 自定义正则
];
```

### 导航守卫

在多个级别控制导航：

- **全局守卫**：`beforeEach`、`beforeResolve`、`afterEach`
- **路由独享守卫**：`beforeEnter`、`beforeLeave`
- **组件内守卫**：`onBeforeRouteLeave`、`onBeforeRouteUpdate`

### 组合式 API

使用 hooks 访问路由器和路由信息：

```tsx
import { useRoute, useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  const route = useRoute();
  
  // 编程式导航
  router.push('/new-path');
  
  // 访问路由信息
  console.log(route.params.id);
}
```

## 开始使用

准备好了吗？前往[安装](/zh/guide/installation)页面在你的项目中设置 essor-router。
