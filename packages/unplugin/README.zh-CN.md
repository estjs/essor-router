# unplugin-essor-router

> 基于文件系统的路由与类型化路由生成插件，服务于 [Essor Router](https://github.com/estjs/essor-router)。支持 Vite、Rollup、Webpack、Rolldown 和 esbuild。

[![npm](https://img.shields.io/npm/v/unplugin-essor-router)](https://www.npmjs.com/package/unplugin-essor-router)
[![license](https://img.shields.io/npm/l/unplugin-essor-router)](https://github.com/estjs/essor-router/blob/main/LICENSE)

## 功能特性

- 📁 **文件路由** — 自动从 `src/pages/` 目录生成路由
- ⚙️ **配置式路由** — 从显式路由配置文件生成类型，无需文件扫描
- 🔤 **类型化路由** — 生成 `typed-router.d.ts`，路由名与 params 完整类型提示
- ⚡ **HMR 支持** — 开发时页面或配置变更自动热更新
- 🎯 **`defineRoute()` 宏** — 页面级元数据、loader、search params 完整类型推断

---

## 安装

```bash
pnpm add -D unplugin-essor-router
```

---

## 快速开始

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import routerPlugin from 'unplugin-essor-router/vite'

export default defineConfig({
  plugins: [
    routerPlugin({
      routesFolder: 'src/pages',   // 默认值
      dts: 'typed-router.d.ts',    // 默认值
    }),
  ],
})
```

其他构建工具：从 `unplugin-essor-router/rollup`、`/webpack`、`/rolldown`、`/esbuild` 引入。

---

## 路由模式

### 模式一：文件路由

在 `src/pages/` 下放置 `.tsx` / `.ts` 文件，路由自动生成：

| 文件 | 路由路径 | 路由名 |
|------|---------|--------|
| `src/pages/index.tsx` | `/` | `/` |
| `src/pages/about.tsx` | `/about` | `/about` |
| `src/pages/users/[id].tsx` | `/users/:id` | `/users/[id]` |
| `src/pages/users/[id]/posts.tsx` | `/users/:id/posts` | `/users/[id]/posts` |
| `src/pages/[...all].tsx` | `/:all(.*)` | `/[...all]` |

**文件命名约定：**

- `index.tsx` → 父路由的索引页
- `_parent.tsx` → 仅作布局节点（有子路由，无自身名称）
- `[[id]].tsx` → 可选参数（`/post/:id?`）
- `[...slug].tsx` → catch-all 参数

### 模式二：配置式路由

在独立配置文件中显式声明路由。插件在构建时静态解析并生成同样的 `typed-router.d.ts`：

```ts
// src/routes.config.ts
import { defineConfigRoutes } from 'unplugin-essor-router'

export default defineConfigRoutes([
  {
    name: 'home',
    path: '/',
    component: () => import('./pages/Home.tsx'),
  },
  {
    name: 'users-id',
    path: '/users/:id',
    component: () => import('./pages/UserDetail.tsx'),
  },
  {
    name: 'users',
    path: '/users',
    component: () => import('./pages/Users.tsx'),
    children: [
      {
        name: 'users-id-posts',
        path: 'posts',
        component: () => import('./pages/UserPosts.tsx'),
      },
    ],
  },
])
```

```ts
// vite.config.ts
routerPlugin({
  configRoutes: 'src/routes.config.ts',
  dts: 'typed-router.d.ts',
})
```

`defineConfigRoutes()` 是一个零运行时成本的 identity 函数，仅用于标记插件的配置文件入口。


---

## 配置项

```ts
type Options = {
  // ──── 文件路由 ─────────────────────────────────────────────
  /** 路由文件扫描目录。默认：'src/pages' */
  routesFolder?: string | RoutesFolderOption | Array<string | RoutesFolderOption>

  /** 允许的文件扩展名。默认：['.tsx', '.ts', '.jsx', '.js'] */
  extensions?: string[]

  /** 排除的 glob 模式（相对 cwd）。默认：[] */
  exclude?: string | string[]

  /** routesFolder 内的文件 glob 模式。默认：['**\/*'] */
  filePatterns?: string | string[]

  // ──── 配置式路由 ───────────────────────────────────────────
  /** defineConfigRoutes() 文件路径，用于配置式路由类型生成。 */
  configRoutes?: string

  // ──── 代码生成 ─────────────────────────────────────────────
  /** 页面组件导入方式。默认：'async' */
  importMode?: 'sync' | 'async' | ((filepath: string) => 'sync' | 'async')

  /** 自定义路由名称函数。 */
  getRouteName?: (node: TreeNode) => string

  /** 单条路由的扩展/修改钩子。 */
  extendRoute?: (route: EditableTreeNode) => void | Promise<void>

  /** 写入文件前的钩子。 */
  beforeWriteFiles?: (rootRoute: EditableTreeNode) => void | Promise<void>

  // ──── 类型生成 ─────────────────────────────────────────────
  /** 生成 typed-router.d.ts。若安装了 TypeScript 默认为 true。 */
  dts?: boolean | string

  /** 项目根目录。默认：process.cwd() */
  root?: string

  // ──── 开发选项 ─────────────────────────────────────────────
  /** 是否监听文件变更。默认：!process.env.CI */
  watch?: boolean

  /** 开启调试日志。默认：false */
  logs?: boolean

  // ──── 路径解析 ─────────────────────────────────────────────
  /** 路径段解析选项。 */
  pathParser?: { dotNesting?: boolean }  // 默认：{ dotNesting: true }

  /** 仅 Vite：从匹配文件自动导出 data loaders。 */
  autoExportsDataLoaders?: string | string[]

  /** 启用自定义 param parsers。 */
  paramParsers?: boolean | { dir?: string | string[] }
}
```

### `RoutesFolderOption`（多目录进阶用法）

```ts
type RoutesFolderOption = {
  src: string
  path?: string | ((filepath: string) => string)
  filePatterns?: string | string[] | ((existing: string[]) => string[])
  exclude?: string | string[] | ((existing: string[]) => string[])
  extensions?: string[] | ((existing: string[]) => string[])
}
```

---

## 虚拟模块

在路由初始化中引入：

```ts
import { createRouter } from 'essor-router'
// 文件路由：自动生成的扁平路由数组
import { routes }   from 'essor-router/auto-routes'
// 预构建静态解析器
import { resolver } from 'essor-router/auto-resolver'

const router = createRouter({ history: 'history', routes, resolver })
```

---

## `defineRoute()` 宏

为页面添加路由级元数据并享有完整类型推断：

```ts
// src/pages/users/[id].tsx
import { defineRoute } from 'essor-router'

export const route = defineRoute({
  name: 'users-id',
  meta: { requiresAuth: true },
  params: {
    path: { id: 'int' },                               // 有类型的 param parser
    query: {
      tab: { parser: 'string', default: 'overview' },  // 带默认值的 query param
    },
  },
  loader: ({ params }) => {
    return fetchUser(params.id);
  },
})

export default function UserPage() { /* ... */ }
```

可提取的字段：`name`、`path`、`alias`、`meta`、`props`、`params.path`、`params.query`、`validateSearch`、`loader`、`beforeLoad`、`start`。

---

## 生成的 `typed-router.d.ts`

插件自动写入此文件，需在 `tsconfig.json` 中包含它：

```json
{
  "include": ["typed-router.d.ts", "src/**/*"]
}
```

文件内容：
- `RouteNamedMap` — 路由名 → 路径/params 类型映射
- `RouteTreeMap` — search/loader/beforeLoad 类型推断
- `_RouteFileInfoMap` — 文件路径 → 路由名 映射

---

## 自动导入

配合 `unplugin-auto-import` 使用：

```ts
import AutoImport from 'unplugin-auto-import/vite'
import { essorRouterAutoImports } from 'unplugin-essor-router'

// vite.config.ts plugins 中：
AutoImport({ imports: [essorRouterAutoImports] })
```

包含：`useRoute`、`useRouter`、`onBeforeRouteUpdate`、`onBeforeRouteLeave`、`definePage`、`defineRoute`。

---

## 常见用法

### 为某个目录添加路径前缀

```ts
routerPlugin({
  routesFolder: [
    'src/pages',
    { src: 'src/admin', path: 'admin/' },
  ],
})
```

### 特定页面使用懒加载

```ts
routerPlugin({
  importMode: (filepath) =>
    filepath.includes('/heavy/') ? 'async' : 'sync',
})
```

### 某个目录仅扫描 .md 文件

```ts
routerPlugin({
  routesFolder: [
    {
      src: 'src/docs',
      extensions: ['.md'],
    },
    'src/pages',
  ],
})
```

---

## License

[MIT](../../LICENSE) © [jiangxd](https://github.com/jiangxd2016)
