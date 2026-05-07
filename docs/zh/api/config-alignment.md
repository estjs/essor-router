# 配置对齐指南

> 本文涉及 `unplugin-essor-router`（构建插件）和 `essor-router-ts-plugin`（TypeScript 语言服务插件）之间的配置对齐关系。

---

## 路由类型生成的两种模式

`unplugin-essor-router` 是唯一的类型生成出口，支持两种输入方式，也可同时使用。

### 模式一：文件路由（自动扫描）

unplugin 扫描 `routesFolder` 目录，自动生成 `typed-router.d.ts`：

```ts
// vite.config.ts
routerPlugin({
  mode: 'file',                     // 默认模式（可省）
  routesFolder: 'src/pages',        // 扫描目录
  dts: 'typed-router.d.ts',         // 类型输出文件
})
```

### 模式二：配置式路由

用户在单独的配置文件里声明路由，unplugin 静态解析并生成同样的 `typed-router.d.ts`：

```ts
// src/routes.config.ts
import { defineConfigRoutes } from 'unplugin-essor-router'

export default defineConfigRoutes([
  { name: 'home',     path: '/',           component: () => import('./pages/Home.tsx') },
  { name: 'users-id', path: '/users/:id', component: () => import('./pages/UserDetail.tsx') },
])
```

```ts
// vite.config.ts
routerPlugin({
  mode: 'config',                        // 声明为配置模式
  configRoutes: 'src/routes.config.ts',  // 必须：配置式路由文件
  dts: 'typed-router.d.ts',
})
```

### 混用（两者同时生效）

```ts
// vite.config.ts
routerPlugin({
  mode: 'file',                          // 保留文件扫描（或者不传 mode 取默认值）
  routesFolder: 'src/pages',             // 文件路由
  configRoutes: 'src/routes.config.ts',  // 额外提供配置式路由文件
  dts: 'typed-router.d.ts',              // 两者类型将会合并输出
})
```

---

## 共享配置对齐

两个配置项在 unplugin 和 ts-plugin 之间**默认值已对齐**，零配置下开箱即用。

| 配置含义 | unplugin 选项 | ts-plugin 选项 | 默认值 |
|---------|--------------|---------------|--------|
| 路由文件目录 | `routesFolder` | `routesFolder` | `'src/pages'` |
| 类型声明文件 | `dts` | `typedRouterDts` | `'typed-router.d.ts'` |
| 路由包名称 | *（不适用）* | `moduleName` | `'essor-router'` |

---

## 修改默认值时的配置方式

### 自定义路由目录

```ts
// vite.config.ts
routerPlugin({ routesFolder: 'src/app/routes' })
```

```json
// tsconfig.json — 必须一致
{ "plugins": [{ "name": "essor-router-ts-plugin", "routesFolder": "src/app/routes" }] }
```

### 自定义类型声明文件路径

```ts
// vite.config.ts
routerPlugin({ dts: 'src/types/typed-router.d.ts' })
```

```json
// tsconfig.json — 必须一致
{ "plugins": [{ "name": "essor-router-ts-plugin", "typedRouterDts": "src/types/typed-router.d.ts" }] }
```

> [!WARNING]
> `dts` 和 `typedRouterDts` 路径不一致时，TS 语言服务会读取旧或不存在的 `.d.ts`，导致路由名称自动补全失效。

---

## 功能对比

| 功能 | 文件路由 | 配置式路由 |
|------|---------|---------|
| `RouteNamedMap` 自动生成 | ✅ | ✅ |
| `router.push({ name })` 类型校验 | ✅ | ✅ |
| params 类型推导 | ✅ | ✅ |
| `useRoute()` 逐文件类型收窄（ts-plugin） | ✅ | ⚠️（需提供 component 路径） |
| `RouteTreeMap`（search/loader 类型推断） | ✅ | ⚠️（需配合 `defineRoute`） |

---

## 问题排查

| 现象 | 可能原因 | 解决方式 |
|------|---------|---------|
| 路由名称无自动补全 | `dts` ≠ `typedRouterDts`，或 `.d.ts` 未生成 | 对齐两处路径；确认 unplugin 写入步骤已执行 |
| 编辑器显示过时的路由名 | `routesFolder` 不一致 | 对齐两处 `routesFolder` |
| 配置式路由类型不更新 | `configRoutes` 文件修改后未触发 HMR | 重启 dev server 或确认 watch 模式开启 |
| `useRoute<'name'>()` 找不到路由 | `moduleName` 与实际 import 包名不符 | 将 `moduleName` 改为实际的包别名 |
