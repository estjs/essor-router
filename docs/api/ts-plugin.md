# TypeScript Plugin API

`essor-router-ts-plugin` is a TypeScript language service plugin that narrows `useRoute()` types by current page file.

## What It Solves

- File-based routes generate route names and path params in `typed-router.d.ts`.
- In normal TypeScript checking, `useRoute()` is usually a broad union.
- This plugin rewrites `essor-router` import resolution per file to a generated proxy module with narrowed route type metadata.

## Installation

```bash
pnpm add -D essor-router-ts-plugin
```

## `tsconfig.json` Setup

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "essor-router-ts-plugin",
        "moduleName": "essor-router",
        "routesFolder": "src/pages",
        "typedRouterDts": "typed-router.d.ts"
      }
    ]
  }
}
```

## Plugin Options

```ts
type TsPluginConfig = {
  moduleName?: string
  routesFolder?: string
  typedRouterDts?: string
}
```

- `moduleName`: router import to intercept. Default: `essor-router`.
- `routesFolder`: page root used to infer project root and route name. Default: `src/pages`.
- `typedRouterDts`: generated typed routes file. Default: `typed-router.d.ts`.

## Resolution Flow

1. For each source file, plugin infers project root from `routesFolder`.
2. It loads route records from `typedRouterDts`.
3. It maps current file path to route name.
4. If route exists, it writes `.essor-router/<route-name>.ts` proxy module.
5. TypeScript resolves `essor-router` to this proxy only for that file.

## Notes

- This is a type-level enhancement for editor/TS checks.
- Runtime behavior is still provided by `essor-router` and `essor-router-unplugin`.
- Keep `routesFolder` aligned with unplugin configuration.
- If a single file maps to multiple routes, `useRoute()` narrows `name`, `path`, and `params` to union types.

## Bug Analysis and Fix Plan (useRoute/useRouter type injection)

### Current Symptoms
- `useRoute()` does not auto-narrow inside route component files.
- In config-based routing, `useRoute()` and `useRouter()` show broad types even when `typed-router.d.ts` exists.

### Root Causes (Code-Level)
- The ts-plugin only narrows per-file types when `_RouteFileInfoMap` is present and the current file can be mapped to that file map. For config-based routes, the generated `typed-router.d.ts` has no file-to-route mapping because the route tree comes from config, not file scanning.
- The plugin relies on `routesFolder` to guess project root. When a file is outside that folder (common for config-based routes or mixed layouts), the project root falls back to `process.cwd()`, and `typed-router.d.ts` may not be found.
- `useRouter()` typing depends on `RouteNamedMap` augmentation from `typed-router.d.ts`. If that `.d.ts` is not included in the TS program (or not resolved), type inference stays broad even though the plugin runs.

### Detailed Fix Plan
1. **Generate file-to-route map for config-based routes**
   - Extend unplugin DTS generation to include `_RouteFileInfoMap` for config-based routes by capturing component file paths in the config route tree.
   - For each config route record, map its `component` (and named view components) file path to the route name(s) and view names.
   - This enables the ts-plugin to narrow `useRoute()` per file for config-based routing as it already does for file-based routing.

2. **Improve project root resolution in the ts-plugin**
   - Prefer `info.project.getCurrentDirectory()` or `languageServiceHost.getCurrentDirectory()` as the base, then locate `typedRouterDts` relative to that directory.
   - If `routesFolder` is present in the file path, still allow the current logic to compute the project root, but add a fallback search upward for `typedRouterDts` when the file is outside the routes folder.
   - This ensures `typed-router.d.ts` is found in monorepo/examples or config-based setups.

3. **Make useRouter type injection consistent**
   - Ensure the generated `typed-router.d.ts` is always included in `tsconfig.json` for apps using the router.
   - Add a diagnostics note in the ts-plugin when `typedRouterDts` is missing or cannot be read, to surface the issue immediately.

4. **Compatibility for mixed mode (file + config)**
   - When both `routesFolder` and `configRoutes` are used, merge file-based and config-based route maps so `useRoute()` narrows correctly regardless of the file’s origin.
   - Deduplicate route names and view names in `_RouteFileInfoMap` during DTS generation.

### Verification Steps
- File-based: in a page file under `routesFolder`, `useRoute().params` should be narrowed to the correct params for that page.
- Config-based: in a component referenced by `configRoutes`, `useRoute().name` and `.params` should be narrowed to the matching route.
- `useRouter().push({ name: ... })` should autocomplete route names and require correct params.
- Confirm `typed-router.d.ts` is regenerated and included in `tsconfig.json`.
