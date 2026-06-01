# API Reference

This section contains the complete API reference for essor-router.

## Core

- [createRouter](/api/create-router) - Create a router instance
- [Router Instance](/api/router-instance) - Router methods and properties
- [Config Alignment](/api/config-alignment) - File-based vs config-based routing modes

## Components

- [RouterView](/api/router-view) - Render matched route components
- [RouterLink](/api/router-link) - Declarative navigation links

## Composition API

- [useRouter](/api/composition-api#userouter) - Access router instance
- [useRoute](/api/composition-api#useroute) - Access current route
- [onBeforeRouteLeave](/api/composition-api#onbeforerouteleave) - Leave guard
- [onBeforeRouteUpdate](/api/composition-api#onbeforerouteupdate) - Update guard

## Advanced

- [Scroll Behavior](/guide/advanced/scroll-behavior) - Custom scroll position logic
- [Query Handling](/guide/advanced/query-handling) - Parse and stringify query strings
- [Custom Param Parsers](/guide/advanced/param-parsers) - Typed route param transformation
- [Config-Based Routing](/guide/advanced/config-based-routing) - Define routes via config file
- [File-Based Routing](/guide/advanced/file-based-routing-unplugin) - File-based routes and codegen

## History

- [createWebHistory](/api/create-router#createwebhistory) - HTML5 History
- [createWebHashHistory](/api/create-router#createwebhashhistory) - Hash History
- [createMemoryHistory](/api/create-router#creatememoryhistory) - Memory History

## Types

- [TypeScript Definitions](/api/types) - Type definitions and interfaces

## Build Plugin

- [Unplugin API](/api/unplugin) - File-based routing, generated modules, and options

## Resolver Toolkit

Stable building blocks for the prebuilt resolver emitted by
`unplugin-essor-router`. Re-exported from the main `essor-router` entry —
useful when assembling a resolver by hand for SSR, tests, or custom
generators:

- `createFixedResolver(records)` - build a `FixedRouteResolver`
- `normalizeRouteRecord(raw)` - normalize a raw record before insertion
- `MatcherPatternPathStatic` - case-insensitive, trailing-slash-tolerant static path
- `MatcherPatternPathDynamic` - regex-driven dynamic path with param parsers
- `MatcherPatternQueryParam` - query-param matcher with default values and `format`
- `PARAM_PARSER_INT`, `PARAM_PARSER_BOOL` - native param parsers
- `FixedResolverParamError` - thrown when `stringify` is called with missing required params
- `definePage`, `defineRoute`, `defineStartRoute` - typed page-definition macros
- `_mergeRouteRecord` - merge helper used by generated code

## Utilities

- [isNavigationFailure](/api/router-instance#isnavigationfailure) - Check navigation failures
- [NavigationFailureType](/api/router-instance#navigationfailuretype) - Failure type enum
