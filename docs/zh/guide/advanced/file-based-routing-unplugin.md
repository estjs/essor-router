# Unplugin 文件路由完整使用指南

本文是 `essor-router-unplugin` 的完整说明：安装、路由约定、`defineRoute()` 全字段、类型系统、HMR 与生产实践。

## 你能获得什么

- 基于文件系统自动生成路由。
- 两个虚拟模块：
  - `essor-router/auto-routes`（路由记录）
  - `essor-router/auto-resolver`（固定优先级 resolver）
- 静态提取 `defineRoute()` / `definePage()` 元信息。
- 自动生成 `typed-router.d.ts` 与页面级 `$route.ts` 类型文件。
- 开发态 watch + HMR 自动更新路由与 resolver。
- 实验能力：param parser、loader 自动导出。

## 快速接入（Vite）

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import essorRouter from 'essor-router-unplugin/vite'

export default defineConfig({
  plugins: [essorRouter({ routesFolder: 'src/pages' })],
})
```

```ts
// src/router.ts
import { createRouter } from 'essor-router'
import { routes } from 'essor-router/auto-routes'
import { resolver } from 'essor-router/auto-resolver'

export const router = createRouter({ history: 'history', routes, resolver })
```

## 文件命名约定（全量）

- `index.tsx` -> `/`
- `users/index.tsx` -> `/users`
- `users/[id].tsx` -> `/users/:id`
- `post/[[id]].tsx` -> `/post/:id?`
- `[...path].tsx` -> `/:path(.*)`
- `users/[id]+.tsx` -> `/users/:id+`
- `(admin)/users.tsx` -> `/users`（分组目录不进 URL）
- `dashboard/_parent.tsx` -> 布局型父节点（约定 `name: false`）
- `index@sidebar.tsx` -> 命名视图 `sidebar`
- `users.[id].tsx` -> `/users/:id`（默认 `dotNesting: true`）

## `defineRoute()` / `definePage()` 支持能力

建议使用静态字面量对象，保证可被稳定静态提取。

```ts
import { defineRoute } from 'essor-router/experimental'

export const route = defineRoute({
  name: 'users-id',
  path: '/people/:id(\\d+)',
  alias: ['/u/:id'],
  meta: { auth: true },
  props: true,
  params: {
    path: { id: 'int' },
    query: {
      keyword: { queryKey: 'q', parser: 'int', format: 'value', required: true },
    },
  },
  validateSearch: input => ({ q: String(input.q ?? '') }),
  loader: async () => ({ ok: true }),
  beforeLoad: () => ({ canEnter: true }),
  start: {
    ssr: true,
    prerender: false,
    prerenderPaths: ['/users/1', '/users/2'],
    preload: 'intent',
  },
})
```

`alias` 必须是绝对路径（以 `/` 开头）。相对路径会被忽略并给出警告。

对于动态预渲染路由，`start.prerenderPaths` 需要提供具体输出路径。`router.getPrerenderPaths()` 不再返回 `/users/:id` 这样的模板路径。

## 生产推荐配置

```ts
essorRouter({
  routesFolder: [
    { src: 'src/pages' },
    { src: 'src/features', filePatterns: '**/pages/**', path: p => p.replace('/pages', '') },
  ],
  dts: 'typed-router.d.ts',
  importMode: file => file.includes('/critical/') ? 'sync' : 'async',
  watch: true,
  experimental: {
    paramParsers: { dir: ['src/params'] },
    autoExportsDataLoaders: ['src/loaders/**'], // 仅 Vite
  },
})
```

最佳实践：
- 默认 `async`，只给关键首屏路由改为 `sync`。
- 提交 `typed-router.d.ts`，并加入 `tsconfig.json`。
- 仅在需要时开启 `paramParsers`。
- 主动清理重复 `path/alias`，不要依赖运行时“碰运气匹配”。

## 排错清单

- 开发态不更新：确认已启用插件且 `watch` 未关闭。
- parser 缺失警告：检查 `src/params`（或自定义目录）是否存在对应 parser 文件。
- 出现 `$route.ts` 路由污染：新版本已默认忽略 companion 文件；若异常请清缓存并重启。
- SSR 水合不一致：保证服务端与客户端路由树、`defineRoute()` 行为完全一致。

常用验证命令：
- `pnpm --filter essor-router-unplugin test`
- `pnpm --filter essor-router-unplugin typecheck`
- `pnpm --filter essor-router-unplugin run build`
