# TypeScript 插件 API

`essor-router-ts-plugin` 是一个 TypeScript 语言服务插件，可根据当前页面文件对 `useRoute()` 做类型收窄。

## 解决的问题

- 文件路由会在 `typed-router.d.ts` 里生成路由名和参数类型。
- 常规 TypeScript 检查下，`useRoute()` 往往是较宽泛的联合类型。
- 本插件会按“当前文件”重写 `essor-router` 的解析到代理模块，提供更精确的路由类型。

## 安装

```bash
pnpm add -D essor-router-ts-plugin
```

## `tsconfig.json` 配置

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

## 配置项

```ts
type TsPluginConfig = {
  moduleName?: string
  routesFolder?: string
  typedRouterDts?: string
}
```

- `moduleName`：要拦截的路由包名，默认 `essor-router`。
- `routesFolder`：用于推断项目根目录和路由名的页面目录，默认 `src/pages`。
- `typedRouterDts`：类型路由声明文件路径，默认 `typed-router.d.ts`。

## 解析流程

1. 按 `routesFolder` 从当前文件推断项目根目录。
2. 读取 `typedRouterDts` 中的路由映射。
3. 将当前文件路径映射为路由名。
4. 命中后生成 `.essor-router/<route-name>.ts` 代理模块。
5. 仅对当前文件，把 `essor-router` 解析到该代理模块。

## 说明

- 该插件只影响类型系统与编辑器提示，不改变运行时行为。
- 运行时仍由 `essor-router` 与 `essor-router-unplugin` 提供。
- 建议确保 `routesFolder` 与 unplugin 的配置保持一致。
- 当单个文件对应多个路由时，`useRoute()` 的 `name`/`path`/`params` 会生成联合类型。

## Bug 分析与修复方案（useRoute/useRouter 类型注入）

### 当前现象
- `useRoute()` 在路由组件文件内无法自动收窄类型。
- 配置式路由下，即使生成了 `typed-router.d.ts`，`useRoute()` / `useRouter()` 仍是宽泛类型。

### 根因定位（代码层面）
- ts-plugin 仅在 `_RouteFileInfoMap` 存在且当前文件能映射到该表时才会做按文件收窄；配置式路由的 `typed-router.d.ts` 没有文件到路由的映射，因此无法收窄。
- 插件用 `routesFolder` 推断项目根目录。当当前文件不在 `routesFolder` 下（配置式或混合模式常见），会回退到 `process.cwd()`，导致找不到 `typed-router.d.ts`。
- `useRouter()` 的类型依赖 `typed-router.d.ts` 中的 `RouteNamedMap` 模块增强；若该 `.d.ts` 未被 TS 程序包含或解析到，类型仍然宽泛。

### 详细修复方案
1. **为配置式路由生成文件到路由的映射**
   - 扩展 unplugin 的 DTS 生成逻辑：从配置式路由树中提取组件文件路径，生成 `_RouteFileInfoMap`。
   - 为每个路由记录收集 `component`（以及命名视图组件）的文件路径，并映射到对应的 route name / view name。
   - 这样 ts-plugin 可以像文件路由一样对配置式路由文件做 `useRoute()` 收窄。

2. **改进 ts-plugin 的项目根目录定位**
   - 优先使用 `info.project.getCurrentDirectory()` 或 `languageServiceHost.getCurrentDirectory()` 作为基准目录，再相对定位 `typedRouterDts`。
   - 当文件不在 `routesFolder` 下时，增加向上搜索 `typedRouterDts` 的兜底策略。
   - 保证 monorepo / examples / 配置式路由项目中也能正确读取类型文件。

3. **确保 useRouter 类型注入稳定**
   - 强制在使用路由的项目 `tsconfig.json` 中包含 `typed-router.d.ts`。
   - 当 `typedRouterDts` 不存在或读取失败时，ts-plugin 输出诊断提示，避免静默失败。

4. **兼容混合模式（文件 + 配置）**
   - 合并文件路由和配置路由的映射结果，确保任意来源的路由文件都能正确收窄。
   - DTS 生成时对 route name / view name 做去重。

### 验收步骤
- 文件路由：在 `routesFolder` 内页面文件中，`useRoute().params` 可正确收窄。
- 配置式路由：在 config 中引用的组件文件内，`useRoute().name` / `.params` 正确收窄。
- `useRouter().push({ name: ... })` 可正确提示路由名并校验 params。
- 确认 `typed-router.d.ts` 已重新生成并加入 `tsconfig.json`。
