# essor-router-ts-plugin

TypeScript Language Service Plugin for `essor-router` — provides strict, inferred typings directly in your IDE for file-based routes.

[![npm](https://img.shields.io/npm/v/essor-router-ts-plugin)](https://www.npmjs.com/package/essor-router-ts-plugin)
[![license](https://img.shields.io/npm/l/essor-router-ts-plugin)](https://github.com/estjs/essor-router/blob/main/LICENSE)

## Features

- **Automatic Type Inference** — Injects proxy types into the TS Language Service from your route definitions
- **IDE Autocompletion** — IntelliSense for route paths, params, and queries in `useRoute()`, `RouterLink`, etc.
- **Zero Build Overhead** — Integrates in the Language Service process (e.g., VS Code); no impact on Vite/Webpack build times
- **Named Views Support** — Correctly narrows types for named view components

## Installation

```bash
npm install -D essor-router-ts-plugin
pnpm add -D essor-router-ts-plugin
yarn add -D essor-router-ts-plugin
```

## Configuration

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [{
      "name": "essor-router-ts-plugin",
      "routesFolder": "./src/pages",
      "typedRouterDts": "./typed-router.d.ts"
    }]
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `routesFolder` | `"src/pages"` | Directory with route files |
| `typedRouterDts` | `"typed-router.d.ts"` | Path to the generated type file |
| `moduleName` | `"essor-router"` | Module to intercept for type proxying |

## VS Code Setup

The plugin requires VS Code to use the workspace TypeScript version:

1. Open a `.ts`/`.tsx` file
2. `Cmd+Shift+P` → `TypeScript: Select TypeScript Version...` → **Use Workspace Version**

Or set in `.vscode/settings.json`:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## How It Works

The plugin intercepts `essor-router` module resolution via `resolveModuleNames`. When `useRoute()` or `RouterLink` is used in a page component, it maps the file path to the generated `_RouteFileInfoMap` in `typed-router.d.ts` and provides per-file type narrowing:

- `route.name` → narrowed to the union of possible route names for this file
- `route.params` → inferred from the route's dynamic segments
- `route.query` → inferred from `defineRoute()` params
- `<RouterLink to={...}>` → autocomplete for route names and paths

## Prerequisites

- `essor-router-unplugin` must be configured to generate `typed-router.d.ts`
- The `typed-router.d.ts` file must be included in `tsconfig.json`:

```json
{
  "include": ["typed-router.d.ts", "src/**/*"]
}
```

## License

[MIT](../../LICENSE) © [estjs](https://github.com/estjs)
