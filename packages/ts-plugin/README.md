# essor-router-ts-plugin

A built-in TypeScript Language Service Plugin for `essor-router` that provides strict, inferred typings directly in your IDE for static and dynamic routes.

By using this plugin, your IDE will automatically understand the shape of your file-based and layout-based route paths, queries, and parameters. Enjoy type safety and native autocomplete features without explicitly setting up or maintaining massive route maps manually.

## Features

- **Automatic Type Inference:** Automatically watches your route definitions and injects proxy types directly into the TypeScript Language Service backend.
- **IDE Autocomplete:** Intelligent prompt suggestions for paths, queries, and param properties everywhere a routing function is used (`useRoute`, `<RouterLink>`, etc.).
- **Zero Build-Time Overhead:** It integrates dynamically inside your code editor's Language Service process (e.g., in VS Code). This guarantees speedy build times with Vite/Webpack while maintaining strict, contextual type checking when editing.

## Installation

```bash
npm install -D essor-router-ts-plugin
# or
yarn add -D essor-router-ts-plugin
# or
pnpm add -D essor-router-ts-plugin
```

## Configuration

Add the plugin configuration array to your `tsconfig.json` compiler options:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "essor-router-ts-plugin",
        // The module name to intercept and proxy for type safety
        "moduleName": "essor-router", 
        // Provide the path to your routes directory
        "routesFolder": "./src/pages",
        // The destination of the generated declaration file
        "typedRouterDts": "./typed-router.d.ts"
      }
    ]
  }
}
```

### Editor Setup (VS Code)

For VS Code to acknowledge this workspace typescript plugin, you will need to tell the editor to rely on your project's `typescript` library instead of its embedded one.

1. Open any TypeScript file in VS Code.
2. Press `Cmd + Shift + P` (or `Ctrl + Shift + P` on Windows/Linux) and run the command: `TypeScript: Select TypeScript Version...`.
3. Choose **Use Workspace Version**.

Alternatively (and highly recommended for teams), you can add the setting to your `.vscode/settings.json` so every team developer inherits the config:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## How It Works Under the Hood

This TS plugin overrides conventional TypeScript language server resolution methods (like `resolveModuleNames`). When an import to `essor-router` is analyzed, the plugin intercepts the request and points the IDE to an auto-generated internal declaration dynamically cached at `.essor-router` inside your project root. 
It recursively maps matching nested files in your specified `routesFolder` and interprets filesystem routing mechanics automatically.

## License

MIT
