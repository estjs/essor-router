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

## 编辑路由树

两个钩子让你以编程方式检视并改写生成的路由。它们都接收一个 `EditableTreeNode`，且都可以是异步的。

### `extendRoute`

在构建路由树时**对每个路由调用一次**。用于修改单个节点——添加 meta、重命名、修改 path、添加别名、插入子路由，或删除它。

```ts
essorRouter({
  extendRoute(route) {
    // 把 /admin 下的所有路由标记为需要鉴权
    if (route.fullPath.startsWith('/admin')) {
      route.addToMeta({ requiresAuth: true });
    }
    // 整体删除某个路由
    if (route.name === 'playground') {
      route.delete();
    }
  },
})
```

### `beforeWriteFiles`

在路由文件**每次（重新）写入时**调用，参数为**根**节点。用于整棵树的改动，或添加不对应任何文件的路由。

```ts
essorRouter({
  beforeWriteFiles(root) {
    // 以编程方式添加一个路由
    const node = root.insert('/home', '/src/pages/index.tsx');
    node.addAlias(['/']);

    // 遍历整棵树
    for (const route of root.traverseDFS()) {
      if (!route.meta.title) route.addToMeta({ title: route.name });
    }
  },
})
```

### `EditableTreeNode`

传入两个钩子的节点对象。主要成员：

| 成员 | 说明 |
|------|------|
| `path` / `fullPath` | 段路径 / 完整解析路径（`path` 可读可写） |
| `name` | 路由名称（可赋值） |
| `meta` / `addToMeta(partial)` | 读取 meta / 合并字段到 meta |
| `alias` / `addAlias(alias)` | 该路由的别名 |
| `params` | 该节点解析出的路径参数 |
| `components` / `component` | 命名视图组件映射 / 默认组件 |
| `children` / `parent` | 树导航 |
| `insert(path, filePath)` | 添加子路由，返回新节点 |
| `delete()` | 从树中移除该节点 |
| `traverseDFS()` / `traverseBFS()` | 子树生成器（也支持 `[Symbol.iterator]`） |

## 路由命名辅助

插件默认的命名可通过 `getRouteName` 复用或替换：

```ts
import { getFileBasedRouteName, getPascalCaseRouteName } from 'unplugin-essor-router'

essorRouter({
  // 默认：基于文件路径，例如 'users-id'
  getRouteName: getFileBasedRouteName,
  // 或 PascalCase，例如 'UsersId'
  // getRouteName: getPascalCaseRouteName,
})
```

## 自动导出数据加载器（Vite）

`AutoExportLoaders` 会把页面组件中的数据加载器重新导出，以便被发现并参与摇树优化。这是一个仅限 Vite 的插件，配合 `autoExportsDataLoaders` 选项使用。

```ts
import { AutoExportLoaders } from 'unplugin-essor-router'

export default {
  plugins: [
    essorRouter({ autoExportsDataLoaders: 'src/loaders/**/*.ts' }),
    AutoExportLoaders({
      transformFilter: 'src/pages/**/*.tsx',     // 要改写哪些页面组件
      loadersPathsGlobs: 'src/loaders/**/*.ts',  // 加载器所在位置
    }),
  ],
}
```

`AutoExportLoadersOptions`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `transformFilter` | `StringFilter` | 要应用自动导出的页面组件 |
| `loadersPathsGlobs` | `string \| string[]` | 匹配加载器文件路径的 glob |
| `root` | `string` | 解析路径的项目根目录（默认 `process.cwd()`） |

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
