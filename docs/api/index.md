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
- [TypeScript Plugin API](/api/ts-plugin) - Route-aware `useRoute()` narrowing in editor/TS checks

## Utilities

- [isNavigationFailure](/api/router-instance#isnavigationfailure) - Check navigation failures
- [NavigationFailureType](/api/router-instance#navigationfailuretype) - Failure type enum
