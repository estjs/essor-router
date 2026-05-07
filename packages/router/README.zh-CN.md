# essor-router

一个专为现代化 Web 应用打造的、支持类型安全的强大路由库。

## 特性

- **类型安全的路由：** 对路由参数、查询参数 (query) 和路径对象提供强大的 TypeScript 类型支持。
- **灵活的 History 模式：** 支持 `createWebHistory`、`createMemoryHistory` 和 `createWebHashHistory`。
- **嵌套路由与视图：** 通过嵌套的 `RouterView` 轻松构建与管理复杂的页面布局。
- **导航守卫：** 内置 `onBeforeRouteLeave`、`onBeforeRouteUpdate` 等核心拦截与监听钩子，实现对导航流程的精细控制。
- **路由数据加载器：** 实验性支持路由 Loader 数据预取，以声明式的方法获取数据。
- **滚动行为：** 支持在不同路由页面间切换时自定义滚动恢复与行为策略。

## 安装

```bash
npm install essor-router
# 或
yarn add essor-router
# 或
pnpm add essor-router
```

## 基础用法

```typescript
import { RouterLink, RouterView, createRouter, createWebHistory } from 'essor-router';

// 定义路由列表
const routes = [
  { path: '/', component: () => import('./pages/Home.tsx') },
  { path: '/about', component: () => import('./pages/About.tsx') },
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 在应用入口中进行挂载
```

## TypeScript 集成

为了获得最佳的开发体验，我们强烈建议搭配使用 [TypeScript 插件](../ts-plugin/README.zh-CN.md)。该插件只需一次简单的配置即可为您项目里的自定义路由、查询参数及各 API 提供自动化类型推断，避免冗杂的类型声明维护成本。

```typescript
import type { RouteRecordRaw } from 'essor-router';

const route: RouteRecordRaw = {
  path: '/user/:id',
  component: UserProfile,
};
```

## 进阶用法

### 导航守卫

```typescript
router.beforeEach((to, from, next) => {
  // 执行鉴权或埋点等操作
  next();
});
```

### 路由数据加载器 (实验性功能)

在路由跳转完成前，使用 loader 预取页面所需的数据进行预加载。

```typescript
const routes = [
  {
    path: '/post/:id',
    loader: async ({ params }) => {
      return fetchPost(params.id);
    },
    component: BlogPost,
  }
];
```

## 许可证

MIT
