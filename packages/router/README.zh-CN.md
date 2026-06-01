# essor-router

一个专为现代化 Web 应用打造的、支持类型安全的强大路由库。

## 特性

- **类型安全的路由：** 对路由参数、查询参数 (query) 和路径对象提供强大的 TypeScript 类型支持。
- **灵活的 History 模式：** 支持 `createWebHistory`、`createMemoryHistory` 和 `createWebHashHistory`。
- **嵌套路由与视图：** 通过嵌套的 `RouterView` 轻松构建与管理复杂的页面布局。
- **导航守卫：** 内置 `onBeforeRouteLeave`、`onBeforeRouteUpdate` 等核心拦截与监听钩子，实现对导航流程的精细控制。
- **路由数据加载器：** 支持路由 Loader 数据预取，以声明式的方法获取数据。
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

### 路由数据加载器

在路由跳转完成前，使用 loader 预取页面所需的数据进行预加载。

```typescript
const routes = [
  {
    path: '/post/:id',
    loader: async ({ params }) => {
      return await fetchPost(params.id);
    },
    component: BlogPost,
  }
];
```

### 预编译解析器(来自 `unplugin-essor-router`)

unplugin 会在构建期生成优化过的 `FixedRouteResolver`,可直接传给
`createRouter`,跳过运行时 matcher 构建:

```tsx
import { resolver } from 'virtual:essor-router/auto-resolver';
import { createRouter, createWebHistory } from 'essor-router';

const router = createRouter({
  history: createWebHistory(),
  resolver,
});
```

#### 路径匹配语义

- `MatcherPatternPathStatic` 大小写不敏感,并容忍尾部斜杠:`/About`、`/about`、
  `/about/` 都会命中同一条记录。
- `MatcherPatternPathDynamic` 先按原始正则匹配,失败时再尝试去掉尾部斜杠。
- `stringify()` 缺少必需参数会抛出 `FixedResolverParamError`(与匹配失败时
  抛出的 `MatcherError` 是两个不同的错误类型)。

## 升级指南(0.0.17-beta.4 及更早版本)

`essor-router/experimental` 入口已合并到主入口。旧路径保留一个发布周期的
兼容 shim,会在运行时打印一次弃用警告。请按下方方式更新 import:

```diff
- import { createFixedResolver, definePage } from 'essor-router/experimental';
+ import { createFixedResolver, definePage } from 'essor-router';
```

unplugin 的 `experimental` 命名空间也已扁平化:

```diff
  vitePlugin({
-   experimental: {
-     paramParsers: true,
-     autoExportsDataLoaders: 'src/loaders/**/*',
-   },
+   paramParsers: true,
+   autoExportsDataLoaders: 'src/loaders/**/*',
  })
```

旧写法仍可加载,但会在控制台打印一次弃用警告。

## 许可证

MIT
