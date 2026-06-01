# Unplugin API 参考

`unplugin-essor-router` 用于生成文件路由、resolver 代码与类型声明。

## 入口

- `unplugin-essor-router/vite`
- `unplugin-essor-router/rollup`
- `unplugin-essor-router/webpack`
- `unplugin-essor-router/rolldown`
- `unplugin-essor-router/esbuild`

## 虚拟模块

- `essor-router/auto-routes`：路由记录 + HMR 热替换辅助。
- `essor-router/auto-resolver`：固定优先级 resolver + matcher 排序 + HMR 热替换辅助。

## 配置项（含默认值）

```ts
type Options = {
  extensions?: string[] // ['.tsx', '.ts', '.jsx', '.js']
  routesFolder?: string | RoutesFolderOption | Array<string | RoutesFolderOption> // 'src/pages'
  exclude?: string | string[] // []
  filePatterns?: string | string[] // ['**/*']
  getRouteName?: (node: TreeNode) => string
  extendRoute?: (route: EditableTreeNode) => void | Promise<void>
  beforeWriteFiles?: (rootRoute: EditableTreeNode) => void | Promise<void>
  importMode?: 'sync' | 'async' | ((filepath: string) => 'sync' | 'async') // 'async'
  root?: string // process.cwd()
  dts?: boolean | string // 安装 typescript 时默认 true
  logs?: boolean // false
  watch?: boolean // !process.env.CI
  pathParser?: { dotNesting?: boolean } // { dotNesting: true }
  autoExportsDataLoaders?: string | string[] // 仅 Vite
  paramParsers?: boolean | { dir?: string | string[] } // 默认目录: ['src/params']
}
```

::: warning 已废弃
原先用于启用 `paramParsers` 与 `autoExportsDataLoaders` 的 `experimental`
命名空间已扁平化。`{ experimental: { paramParsers, autoExportsDataLoaders } }`
形式仍可加载,但会在控制台打印一次弃用警告;请把两个键直接放到顶层。
:::

## `routesFolder` 高级形态

```ts
type RoutesFolderOption = {
  src: string
  path?: string | ((filepath: string) => string)
  filePatterns?: string | string[] | ((existing: string[]) => string[])
  exclude?: string | string[] | ((existing: string[]) => string[])
  extensions?: string[] | ((existing: string[]) => string[])
}
```

适合多目录路由、按目录定制匹配规则。

## `defineRoute()` 可静态提取字段

unplugin 会提取并合并：

- `name`、`path`、`alias`、`meta`、`props`
- `params.path` 与 `params.query`
- `validateSearch`、`loader`、`beforeLoad`、`start`

`definePage`、`defineRoute`、`defineStartRoute` 都会被识别,行为完全一致 —
后两个是 `definePage` 的别名,方便调用处读起来更自然。

Query 参数可配置：
- `queryKey`、`parser`、`format`（`value | array`）、`default`、`required`

## 包内运行时导出

- `resolveOptions()`
- `createRoutesContext()`
- `createTreeNodeValue()`
- `EditableTreeNode`
- `essorRouterAutoImports`

`essorRouterAutoImports` 包含：
- `essor-router`：`useRoute`、`useRouter`、`onBeforeRouteUpdate`、`onBeforeRouteLeave`
- `essor-router`：`definePage`、`defineRoute`、`defineStartRoute`

## 推荐基础配置

```ts
essorRouter({
  routesFolder: 'src/pages',
  dts: 'typed-router.d.ts',
  importMode: 'async',
  watch: true,
  pathParser: { dotNesting: true },
})
```

中大型项目建议使用：函数式 `importMode`、多 `routesFolder`、按需启用 `paramParsers`。
