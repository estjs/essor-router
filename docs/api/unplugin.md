# Unplugin API

`unplugin-essor-router` generates file-based routes, resolver code, and typed declarations for Essor Router.

## Entry Points

- `unplugin-essor-router/vite`
- `unplugin-essor-router/rollup`
- `unplugin-essor-router/webpack`
- `unplugin-essor-router/rolldown`
- `unplugin-essor-router/esbuild`

## Virtual Modules

- `essor-router/auto-routes`: route records + HMR patch helper.
- `essor-router/auto-resolver`: fixed resolver + matcher ranking + HMR patch helper.

## Options (with defaults)

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
  dts?: boolean | string // true if typescript is installed
  logs?: boolean // false
  watch?: boolean // !process.env.CI
  pathParser?: { dotNesting?: boolean } // { dotNesting: true }
  autoExportsDataLoaders?: string | string[] // Vite only
  paramParsers?: boolean | { dir?: string | string[] } // default dir: ['src/params']
}
```

::: warning Deprecated
The `experimental` namespace previously used to enable `paramParsers` and
`autoExportsDataLoaders` has been flattened. Configs of the form
`{ experimental: { paramParsers, autoExportsDataLoaders } }` still load
but print a one-time deprecation warning; move the keys to the top
level.
:::

## `routesFolder` Advanced Shape

```ts
type RoutesFolderOption = {
  src: string
  path?: string | ((filepath: string) => string)
  filePatterns?: string | string[] | ((existing: string[]) => string[])
  exclude?: string | string[] | ((existing: string[]) => string[])
  extensions?: string[] | ((existing: string[]) => string[])
}
```

Use this for multi-source routing and per-folder filtering.

## `defineRoute()` Extracted Fields

The unplugin statically extracts and merges:

- `name`, `path`, `alias`, `meta`, `props`
- `params.path` and `params.query`
- `validateSearch`, `loader`, `beforeLoad`, `start`

`definePage`, `defineRoute`, and `defineStartRoute` are all recognized
and behave identically — `defineRoute` and `defineStartRoute` are
aliases of `definePage` provided so call sites read naturally.

Query param options:
- `queryKey`, `parser`, `format` (`value | array`), `default`, `required`

## Runtime Exports from Package

- `resolveOptions()`
- `createRoutesContext()`
- `createTreeNodeValue()`
- `EditableTreeNode`
- `essorRouterAutoImports`

`essorRouterAutoImports` includes:
- from `essor-router`: `useRoute`, `useRouter`, `onBeforeRouteUpdate`, `onBeforeRouteLeave`
- from `essor-router`: `definePage`, `defineRoute`, `defineStartRoute`

## Editing the Route Tree

Two hooks let you programmatically inspect and rewrite generated routes. Both receive an `EditableTreeNode` and may be async.

### `extendRoute`

Invoked **once per route** as the tree is built. Use it to modify a single node — add meta, rename, change the path, add aliases, insert children, or delete it.

```ts
essorRouter({
  extendRoute(route) {
    // Mark everything under /admin as protected
    if (route.fullPath.startsWith('/admin')) {
      route.addToMeta({ requiresAuth: true });
    }
    // Drop a route entirely
    if (route.name === 'playground') {
      route.delete();
    }
  },
})
```

### `beforeWriteFiles`

Invoked **every time** the route files are (re)written, with the **root** node. Use it for tree-wide changes or to add routes that don't map to a file.

```ts
essorRouter({
  beforeWriteFiles(root) {
    // Add a route programmatically
    const node = root.insert('/home', '/src/pages/index.tsx');
    node.addAlias(['/']);

    // Walk the whole tree
    for (const route of root.traverseDFS()) {
      if (!route.meta.title) route.addToMeta({ title: route.name });
    }
  },
})
```

### `EditableTreeNode`

The node object passed to both hooks. Key members:

| Member | Description |
|--------|-------------|
| `path` / `fullPath` | Segment path / full resolved path (read or assign `path`) |
| `name` | Route name (assignable) |
| `meta` / `addToMeta(partial)` | Read meta / merge fields into meta |
| `alias` / `addAlias(alias)` | Aliases for this route |
| `params` | Parsed path params of the node |
| `components` / `component` | Named view component map / default component |
| `children` / `parent` | Tree navigation |
| `insert(path, filePath)` | Add a child route, returns the new node |
| `delete()` | Remove this node from the tree |
| `traverseDFS()` / `traverseBFS()` | Generators over the subtree (also `[Symbol.iterator]`) |

## Route Name Helpers

The plugin's default naming can be reused or swapped via `getRouteName`:

```ts
import { getFileBasedRouteName, getPascalCaseRouteName } from 'unplugin-essor-router'

essorRouter({
  // Default: file-path based, e.g. 'users-id'
  getRouteName: getFileBasedRouteName,
  // Or PascalCase, e.g. 'UsersId'
  // getRouteName: getPascalCaseRouteName,
})
```

## Auto-Exporting Data Loaders (Vite)

`AutoExportLoaders` re-exports data loaders from page components so they can be discovered and tree-shaken. It is a Vite-only plugin and pairs with the `autoExportsDataLoaders` option.

```ts
import { AutoExportLoaders } from 'unplugin-essor-router'

export default {
  plugins: [
    essorRouter({ autoExportsDataLoaders: 'src/loaders/**/*.ts' }),
    AutoExportLoaders({
      transformFilter: 'src/pages/**/*.tsx',     // which page components to rewrite
      loadersPathsGlobs: 'src/loaders/**/*.ts',  // where loaders live
    }),
  ],
}
```

`AutoExportLoadersOptions`:

| Field | Type | Description |
|-------|------|-------------|
| `transformFilter` | `StringFilter` | Page components to apply the auto-export to |
| `loadersPathsGlobs` | `string \| string[]` | Globs matching the loader file paths |
| `root` | `string` | Project root for resolving paths (default `process.cwd()`) |

## Recommended Baseline

```ts
essorRouter({
  routesFolder: 'src/pages',
  dts: 'typed-router.d.ts',
  importMode: 'async',
  watch: true,
  pathParser: { dotNesting: true },
})
```

For large apps, use functional `importMode`, multi `routesFolder`, and `paramParsers` only where needed.
