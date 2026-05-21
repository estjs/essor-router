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
- from `essor-router`: `definePage`, `defineRoute`

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
