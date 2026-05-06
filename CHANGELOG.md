# Changelog

## [0.0.16-beta.7] - Unreleased

### Added
- Config-based routing mode (`mode: 'config'`) with `defineConfigRoutes()` and `configRoutes` option
- Named views type passthrough through routed file info map
- Experimental route data loaders (`experimental.autoExportsDataLoaders`)
- Rolldown and esbuild bundler entry points
- HMR abstraction for codegen modules
- Comprehensive e2e tests for guards, history modes, route params, and navigation

### Changed
- Codegen modules use lazy dynamic imports to reduce startup time
- Improved `mergeDeep` meta merging logic — handles null values correctly
- Simplified `options.ts` normalization with shared `normalizeOverridableArray` helper
- Improved `getTypedRouteSource` to prefer default view component

### Fixed
- Bug in `collectDuplicatedRouteNodes` where `Object.keys(nodes)` was used instead of `nodes.length`
- Removed `filePath.remove()` call that should have been `routeTree.removeChild(filePath)`

## [0.0.16-beta.6] - 2026-01-09

### Added
- Experimental param parsers support
- `typed-router.d.ts` generation with route name map, tree map, and file info map
- `$route.ts` companion type generation
- Vite dev server HMR context
- Auto-imports map export for `unplugin-auto-import`

### Changed
- Migrated path parsing to tokenized state machine (pathTokenizer + pathParserRanker)
- Unified route block type definitions across definePage and defineRoute
- Refined path segment parsing for dot nesting, group folders, and hex character codes

### Fixed
- Duplicate param detection now warns in dev
- Named view file info map correctly groups multi-view routes
- Alias path generation handles absolute paths in static resolver
