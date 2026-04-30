# essor-router-ts-plugin

这是一个与 `essor-router` 深度集成的 TypeScript Language Service 插件。旨在为您的静态和动态路由提供开箱即用、IDE 级别的强类型推导及智能提示。

在项目中启用本插件之后，您的代码编辑器将能自动解析基于文件约定与目录映射的路由，并且在使用 `useRoute`、`<RouterLink>` 及各项路由跳转方法时为您提供可靠的类型安全验证与动态补全。这一切都将自动发生，再也无需维护冗长的路由类型映射声明表。

## 核心特性

- **自动化类型推断：** 插件通过动态监测文件路由逻辑并将代理类型接入由于 TypeScript Server 中的内核级补全层来实现全局路由的类型解析。
- **IDE 全方位智能补全：** 对路径、不同路由结构下特化的 Params、及对应的 Query 给予实时下拉提示响应。
- **无运行时/打包性能瓶颈：** 由于机制完全运行于编辑器内的 Language Service（比如在 VS Code 的 TS LSP），您的终端编译以及像 Vite 或 Webpack 分包构建过程中完全零损耗。

## 安装

```bash
npm install -D essor-router-ts-plugin
# 或
yarn add -D essor-router-ts-plugin
# 或
pnpm add -D essor-router-ts-plugin
```

## 配置指南

在您项目的 `tsconfig.json` 下的 `compilerOptions` 节点中增加关于插件的指向配置：

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "essor-router-ts-plugin",
        // 被代理并在内部提供路由映射的模块名
        "moduleName": "essor-router", 
        // 指定您的路由相关文件结构位于的本地目录
        "routesFolder": "./src/pages",
        // 插件运行时实时生成和依据的类型声明文件路径
        "typedRouterDts": "./typed-router.d.ts"
      }
    ]
  }
}
```

### 启用编辑器支持 (VS Code)

默认情况下 VS Code 可能会采用编译器内置全局的 TS SDK 从而导致工作区级别生效的 Plugin 没有执行。如要使插件生效，您需要执行以下覆盖：

1. 打开工作空间下的任意 TypeScript 文件。
2. 呼出快捷命令提示框：`Cmd + Shift + P` (Mac) 或 `Ctrl + Shift + P` (Win)。
3. 输入并选择操作 `TypeScript: Select TypeScript Version...`。
4. 随后在弹出的下拉库中选择：**Use Workspace Version** (使用工作区版本)。

**(推荐姿势)** 您团队可以考虑将其存入工程中的 `.vscode/settings.json` 以免去每个新加入项目的开发者重新设置带来的繁琐：

```json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 原理简述

插件层覆写了 TypeScript 语言服务的常规查找钩子（如 `resolveModuleNames` 等）。当该插件检测到任意引用了 `essor-router` 的导出声明，就会将其无缝截获并在工程临时产出路径 `.essor-router` 中代理读取为您动态生成好的一份路由解析定义文件。该定义实时扫描追踪由 `routesFolder` 指明的目录层次进行路由信息表维护。

## 许可证

MIT
