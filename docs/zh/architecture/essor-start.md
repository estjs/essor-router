---
sidebar_label: Essor Start 同构元框架设计
---

# Essor Start 同构元框架设计

> 状态：架构设计。本文是 `essor-start` 的单一权威设计文档，已整合 SolidStart、Nuxt、Next.js、Nitro 与 Unhead 的调研结论。目标是设计一个只服务 Essor 的、同构优先的、真正可落地的 Start 元框架，同时保持 `essor-router` 稳定、简单、清晰。

## 1. 最终结论

`essor-start` 不应该把 `essor-router` 改造成“大而全”的服务端框架。`essor-router` 已经是稳定路由内核，应继续专注于匹配、导航、类型路由、文件路由和可扩展 hook；SSR、数据请求、服务端函数、HTTP server、缓存、部署、Head、预渲染等元框架能力由 `essor-start` 负责。

推荐架构如下：

```text
existing essor-router + unplugin
  -> one typed route tree / RouteNamedMap
  -> client route manifest (component + chunks)
  -> server route manifest (beforeLoad + loader + action + head)

essor-start client
  -> hydrate Essor
  -> restore Seroval payload
  -> coordinate router.push/preloadRoute + data endpoint

essor-start server
  -> Nitro renderer
  -> route match from existing router manifest
  -> parent-to-child beforeLoad/loader
  -> Essor streaming SSR + Unhead
  -> Seroval payload/stream

Nitro
  -> H3, server/api, middleware, routeRules
  -> cache/storage, runtimeConfig, prerender
  -> static assets, tasks, WebSocket, presets, .output
```

最重要的取舍：

1. **只支持 Essor**：不做 React/Vue/Solid 的通用抽象，不复制 SolidStart 的框架无关层。
2. **不新增第二套路由类型系统**：Start 直接复用 `essor-router` 的 `RouteNamedMap`、`InferRouteSearch`、`InferRouteLoaderData`、`InferRouteBeforeLoadData` 和现有 typed route locations。
3. **不学习 TanStack Start 的类型化数据系统**：数据类型来自现有 route 对象与 router 类型推导，不再引入 `FileRoute`、route class 或独立 route DSL。
4. **完整利用 Nitro**：Nitro 是 server/build/runtime/deploy 基础，不只是一个 adapter。Start 不自写 HTTP server、cache storage、preset、`.output` 格式或部署适配器。
5. **Head/SEO 完整使用 Unhead v3**：Start 只做 Essor composable 与请求级实例桥接，不自研 Head 合并、去重、排序和 DOM 更新算法。
6. **序列化使用 Seroval**：payload、Server Function 与 deferred stream 使用 `seroval` + `seroval-plugins/web`，默认使用安全 JSON/cross-reference 模式，不把 `eval()` 模式作为生产默认值。
7. **页面路由沿用当前 router 文件约定**：不新增目录式页面/资源路由协议；API/resource routes 使用 Nitro 的 `server/api/**` 与 `server/routes/**`。
8. **loader 不公开依赖图 API**：首版保持 matched routes 从父到子执行：每个 route 先 `beforeLoad`，再 `loader`。用户需要并发时在单个 loader 内使用 `Promise.all()`。

## 2. 产品定义

`essor-start` 是 Essor 应用的同构运行时、构建系统与部署框架。它负责把同一套路由树编译成浏览器可用的 client manifest、服务端可用的 server manifest，并在 Nitro/H3 的请求生命周期中执行 Essor SSR、loader、action、Server Function、Head 收集、payload 序列化、预渲染与部署输出。

默认体验：

- 首个 GET 请求由 Nitro 接收，进入 Start renderer，服务端执行路由匹配、`beforeLoad`、`loader`、Head 收集和 Essor SSR。
- HTML 中内联经过安全序列化的 route payload，客户端 hydration 不重复执行首屏 loader。
- 后续客户端导航由 Start client runtime 先请求内部 data endpoint，再调用稳定的 `essor-router` 公共 API 完成导航。
- action 与 Server Function 永远在服务端执行，客户端只拿到编译器生成的安全 proxy。
- 应用作者只需要 `src/routes`、`vite.config.ts` 和可选 `essor-start.config.ts`；需要数据库、会话、平台 binding 时再提供可选的 server context 工厂。

设计原则：

1. **约定优于配置**：默认 `src/routes`、默认 client/server entry、默认 Nitro Node preset、默认 SSR。
2. **router 简单稳定**：Start 不要求 router 引入 Nitro、H3、Unhead、Seroval 或服务端状态。
3. **同构优先**：同一 route module 同时服务 SSR、hydration、client navigation 与 prerender，但编译期拆分 client-safe/server-only 导出。
4. **显式服务端边界**：loader、action、server function、middleware 进入 server bundle；页面组件和 client-safe metadata 进入 client bundle。
5. **成熟库优先**：通用基础能力优先交给 Nitro、Unhead、Seroval、Vite、Playwright、图片 provider 等成熟项目。
6. **简单默认值，渐进增强**：无配置即可 SSR；缓存、ISR、Worker preset、WebSocket、tasks、图片优化等按需开启。

## 3. 研究依据与取舍

### 3.1 SolidStart 的可借鉴点

SolidStart 最值得学习的不是 API 名字，而是工程边界：

- 同一套路由树生成 client 与 SSR 两种视图，client 只包含页面组件和 client-safe exports，server 包含 loader、action、server handler 与 route config。
- 构建期通过导出裁剪和 tree-shaking 防止 server-only 代码进入浏览器。
- Vite client/SSR 两套 environment、manifest 与 entry 分离。
- Server Functions 是编译能力：稳定 id、客户端 proxy、服务端 registry、专用 handler。
- 使用 Seroval 和 Web plugins 处理跨端值与流式数据。
- SSR bundle 作为 Nitro renderer 的输入，Nitro 负责 server runtime、public assets、prerender、preset 与生产输出。

Essor Start 应采用这些工程原则，但不照搬 SolidStart 的 Solid API，也不把 Solid 的资源模型迁移到 Essor。

参考来源：

- <https://github.com/solidjs/solid-start/blob/main/packages/start/src/config/fs-router.ts>
- <https://github.com/solidjs/solid-start/blob/main/packages/start/src/config/fs-routes/index.ts>
- <https://github.com/solidjs/solid-start/blob/main/packages/start/src/config/fs-routes/tree-shake.ts>
- <https://github.com/solidjs/solid-start/blob/main/packages/start/src/config/index.ts>
- <https://github.com/solidjs/solid-start/tree/main/packages/start/src/directives>
- <https://github.com/solidjs/solid-start/tree/main/packages/start/src/fns>
- <https://github.com/solidjs/solid-start/blob/main/packages/start/src/fns/serialization.ts>

### 3.2 Nuxt 的可借鉴点

Nuxt 的价值在于“完整利用 Nitro”和“universal 默认”：

- SSR loader 结果写入 hydration payload，客户端 hydration 不重复请求。
- 默认 universal rendering，route rules 控制 SSR、CSR、prerender、SWR 与缓存。
- Head 直接使用 Unhead，不自研 Head 算法。
- `useAsyncData()` 是有用的组件级数据能力，但 Essor Start 后续实现时必须复用同一个 route data store，不能再建第二套缓存图。

参考来源：

- <https://github.com/nuxt/nuxt/blob/main/docs/1.getting-started/10.data-fetching.md>
- <https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/composables/asyncData.ts>
- <https://github.com/nuxt/nuxt/blob/main/docs/3.guide/1.concepts/1.rendering.md>
- <https://github.com/nuxt/nuxt/blob/main/docs/3.guide/1.concepts/4.server-engine.md>
- <https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/composables/head.ts>

### 3.3 Next.js 的可借鉴点

Next.js 值得学习的是生产能力完整度，而不是 React Server Components 本身：

- route 级 code splitting、Link prefetch、loading/error/not-found 约定。
- 静态、动态、ISR、cache tag 与 revalidation 的完整语义。
- server-only 边界、Action 鉴权、CSP、环境变量和生产检查表。
- metadata、image、font、script、sitemap、robots、OpenGraph 等应用级能力。

首版不采用：

- RSC、Flight、PPR。这些绑定 React 编译和运行模型，Essor 当前没有对应基础。
- 复杂的自动静态/动态推断。Essor Start 应先使用明确的 route `render` 设置和构建期诊断。
- 多层隐式 fetch cache。缓存统一为 route data store + Nitro cache/storage。

参考来源：

- <https://github.com/vercel/next.js/tree/canary/docs/01-app/01-getting-started>
- <https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/production-checklist.mdx>
- <https://github.com/vercel/next.js/blob/canary/docs/01-app/01-getting-started/15-route-handlers.mdx>

### 3.4 需要明确避免的方向

- 不把 `essor-router` 变成 server framework。
- 不自研 Nitro 已经提供的 HTTP server、route rules、storage、cache、tasks、WebSocket、preset 和 `.output`。
- 不自研 Unhead 已经提供的 title/meta/link/script 合并、去重、排序和 DOM renderer。
- 不新增目录式页面文件、目录式资源 handler、`+server.ts` 等第二套文件约定。
- 不提供公开 loader 依赖图 API。
- 不允许 client bundle 导入 `essor-start/server`、Nitro、H3、数据库、私有环境变量或 server function 实现。

## 4. 依赖策略

| 领域                  | 采用                                               | Start 自己负责                                         |
| --------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| 构建与 HMR            | Vite                                               | 双端 entry、route export 分析、manifest、错误诊断      |
| 文件路由与类型        | 现有 `unplugin-essor-router`、`essor-router`       | 生成 client/server manifest，复用 `RouteNamedMap`      |
| Server/runtime/deploy | Nitro/H3/Unstorage/Unenv                           | Essor renderer、Start data pipeline、Nitro 集成模块    |
| Head/SEO              | Unhead v3                                          | Essor `useHead()`/`useSeoMeta()`、请求级实例、SSR 注入 |
| 序列化                | `seroval`、`seroval-plugins/web`                   | payload 协议、版本、限制、安全边界                     |
| 缓存与存储            | Nitro routeRules、cached handler/function、storage | route id/tag 到 Nitro cache key 的映射                 |
| 图片                  | `sharp` 或 provider                                | `<StartImage>` API、域名白名单、asset manifest         |
| 测试                  | Vitest、Playwright、Nitro preset harness           | 跨 preset 契约测试、bundle 边界测试                    |

依赖使用规则：

1. 一个领域只有一个权威实现。Head 只走 Unhead；server/cache/deploy 只走 Nitro；序列化只走 Seroval。
2. 第三方能力隐藏在 Start 公共 API 后。应用使用 `useHead()`、`defineRoute()`、`createServerFn()`、`essorStart()`，不依赖 Nitro 私有实现。
3. Nitro 必须集中在 `src/nitro/` 内部集成模块中，版本精确 pin，并通过 preset contract tests 控制升级风险。
4. 新依赖进入 client bundle 前必须有体积、安全、license 和 SSR/CSR 边界检查。
5. 只有依赖无法覆盖 Essor 特定需求时，Start 才补一层很薄的适配代码。

## 5. 包结构与模块边界

```text
packages/
  essor-router/                 # 稳定 router 内核：匹配、导航、类型路由、SPA 状态
  unplugin/                     # 文件路由扫描、类型生成、route manifest 基础
  essor-start/
    src/client/                 # hydrate、client transition、payload 恢复、data endpoint 调度
    src/server/                 # request pipeline、SSR、loader/action executor
    src/runtime/                # 跨端协议与公共 types；不得导入 node:* 或 Nitro
    src/vite/                   # Vite plugin、route compiler、virtual modules
    src/nitro/                  # Nitro config、renderer、generated handlers、preset tests
    src/prerender/              # 预渲染调度；实际输出仍走 Nitro
    src/entry-client.ts
    src/entry-server.ts
```

公开入口：

- `essor-start`：应用 API，如 `defineRoute()`、`useRouteData()`、`useHead()`。
- `essor-start/client`：client-only API。
- `essor-start/server`：server-only API，如 `createStartServer()`、`createServerFn()`。
- `essor-start/vite`：Vite 插件。
- `essor-start/config`：统一配置。

不提供 Start 自有部署 adapter 目录。部署目标由 `nitro.preset` 决定。

模块依赖规则：

```text
runtime  <- client
runtime  <- server
vite     -> runtime/server
nitro    -> server/runtime
app      -> public essor-start entries
```

`runtime` 只能使用标准 JavaScript 与 Web API 类型。`server` 可以依赖 Essor SSR renderer 与 Nitro runtime API。`client` 可以依赖 Essor DOM hydration。Vite 插件必须在 client build 中阻止 `essor-start/server`、`nitro`、`h3`、`node:*`、数据库驱动、私有环境变量进入浏览器。

## 6. Athen 可复用经验

`/home/ziyang/Documents/www/athen` 可作为 Essor 生态内的工程参考，但 Start 的目标不是文档站 SSG，而是生产级同构元框架。

| Athen 模式                                                  | Start 继承方式                                                                                                     | Start 必须补齐                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `createBuildContext()` 统一解析配置、扫描路由、生成页面索引 | 创建不可变 `StartBuildContext`，持有配置、route manifest、server function manifest、asset manifest、build revision | 请求级状态绝不存入 BuildContext                      |
| `runtimeModules.ts` 生成 virtual modules                    | 生成 `essor-start:*` 虚拟模块作为 compiler 到 runtime 的唯一数据桥                                                 | 严格分离 client-safe 与 server-only 模块             |
| Vite client/SSR/SSG 构建分层                                | 固定为 client build + server build + prerender 阶段                                                                | prerender 调用 server handler，不复用 SSG-only entry |
| 插件顺序和 Essor alias/dedupe                               | 固定 Start transform、route transform、Essor transform、manifest、用户插件顺序                                     | 覆盖 dev SSR、HMR、production build                  |

推荐虚拟模块：

```text
essor-start:route-manifest         # client-safe：id、path、父子关系、chunk、render mode
essor-start:route-types            # 复用 essor-router RouteNamedMap 的类型扩增
essor-start:server-manifest        # server-only：loader/action/middleware/function 引用
essor-start:client-entry           # hydration、payload 恢复、Start navigation runtime
essor-start:asset-manifest         # hash 资源、CSS、modulepreload 信息
```

运行时只能从这些虚拟模块和应用公开 route module 导入数据。禁止 client runtime 扫描文件系统，禁止 server runtime 根据请求参数拼动态 import 路径。

## 7. Nitro 集成设计

Nitro 是 `essor-start` 的正式 server/build/runtime/deploy 基础。Start 通过 Nitro framework/Vite 集成注册 renderer、server routes、public assets、route rules、runtime config、storage、tasks、WebSocket 与 presets。

```ts
// essor-start.config.ts
import { defineStartConfig } from "essor-start/config";

export default defineStartConfig({
  nitro: {
    preset: "cloudflare",
    routeRules: {
      "/assets/**": {
        headers: { "cache-control": "public, max-age=31536000, immutable" },
      },
    },
    storage: {
      cache: { driver: "redis", url: process.env.REDIS_URL },
    },
  },
});
```

Start 为 Nitro 注册三类产物：

1. **精确 server routes**：内部 data endpoint、Server Function RPC、health/OpenAPI 等由 compiler 生成 Nitro/H3 handler。
2. **Essor renderer**：所有没有被精确 handler 接管的页面 GET 请求进入 Start renderer。
3. **Nitro 生命周期集成**：request/response/error/close hooks 负责 request id、trace、错误上报、资源清理和后台任务。

请求顺序：

```text
static assets
  -> Nitro routeRules
  -> Nitro middleware
  -> Nitro server/api or server/routes
  -> Start Essor renderer
  -> Nitro response/error hooks
```

页面 loader、SSR 和 hydration 只在 Start renderer 中执行。API/resource routes 使用 Nitro 原生约定：

```text
server/api/**       # /api 前缀，适合应用 API
server/routes/**    # 精确 server route，适合 webhook、文件下载、自定义 HTTP
server/middleware/**# Nitro/H3 middleware
```

Start 不再定义页面目录内的资源 handler 协议。如果应用需要公开 HTTP endpoint，就写 Nitro server route；如果需要页面，就写现有 `essor-router` 页面路由文件。

Nitro 版本策略：

- `essor-start` 内部精确 pin Nitro 版本，不把 Nitro 私有类型大面积暴露为 public API。
- `src/nitro/` 是唯一可直接调用 Nitro 内部 API 的目录。
- 每次 Nitro 升级必须跑 preset contract tests。
- Node preset 是稳定支持基线；Worker/Cloudflare/Vercel/Netlify 等 preset 通过契约测试后标为稳定，否则标为实验性。

## 8. 路由模块协议

页面路由沿用当前 `essor-router` 文件约定。一个页面 route module 可以有默认 Essor 组件和可选 `route` 导出：

```tsx
// src/routes/articles/[id].tsx
import { defineRoute, json, useRouteData } from "essor-start";
import { getArticle, updateArticle } from "~/server/articles";

export const route = defineRoute({
  validateSearch: articleSearchSchema,
  cache: { maxAge: 60_000, tags: ["article"] },
  beforeLoad: ({ locals }) => ({ canEdit: locals.session?.userId != null }),
  loader: ({ params, locals }) => getArticle(locals.db, params.id),
  action: async ({ request, params, locals }) => {
    const form = await request.formData();
    const article = await updateArticle(locals.db, params.id, form);
    return json(article, { invalidate: ["article"] });
  },
  headers: ({ data }) => ({
    "Cache-Control": data.isPublic ? "public, max-age=60" : "private",
  }),
  head: ({ data, params }) => ({
    title: `${data.title} | Essor`,
    meta: [{ name: "description", content: data.summary }],
    link: [{ rel: "canonical", href: `/articles/${params.id}` }],
  }),
});

export default function ArticlePage() {
  const article = useRouteData<typeof route>();
  return <article>{article.title}</article>;
}
```

`defineRoute()` 是对现有 router route 类型的 Start 薄包装。它保留 `params`、`validateSearch`、`beforeLoad`、`loader` 类型语义，只增加 Start 服务端字段：

- `action`
- `headers`
- `cache`
- `render`
- `revalidate`
- `prerender`
- `head`

`beforeLoad` 是 Start 请求阶段，接收 `StartRequestContext`，只能返回可合并 plain object、`redirect()`、`notFound()` 或抛出错误。父到子的返回对象浅合并为只读 `routeContext`，随后传给本 route 的 loader/action。重复 key 在开发期报错，避免隐式覆盖。

## 9. 现有 Router 类型复用

Start compiler 必须继续调用现有 unplugin 的类型生成，不生成另一份 route map。

```ts
import type {
  InferRouteBeforeLoadData,
  InferRouteLoaderData,
  InferRouteSearch,
  RouteLocationRawTyped,
} from "essor-router";

type ArticleSearch = InferRouteSearch<typeof route>;
type ArticleData = InferRouteLoaderData<typeof route>;
type ArticleAccess = InferRouteBeforeLoadData<typeof route>;

const toArticle: RouteLocationRawTyped = {
  name: "articles-id",
  params: { id: "42" },
};
```

约束：

- `useRouteData<typeof route>()` 等价于 `InferRouteLoaderData<typeof route>`。
- `router.push()`、`router.resolve()`、`RouterLink` 继续消费 `RouteNamedMap` 增强后的现有 typed route locations。
- Start 不创建 `FileRoute`、route class、字符串 route id 泛型或第二套 params/search 类型。
- Server Function 的输入/输出从 `.input()`/`.handler()` 推导，不污染路由类型图。

## 10. 请求、渲染与 Hydration

GET 页面请求流程：

```text
Nitro/H3 event
  -> Web Request
  -> Start createRequestContext
  -> route match from existing router manifest
  -> matched routes parent-to-child:
       beforeLoad(route)
       loader(route)
  -> response metadata merge
  -> Essor SSR + Unhead collect
  -> Seroval payload
  -> HTML shell / stream
  -> Response
```

服务端入口：

```ts
// src/entry-server.ts
import { createStartServer } from "essor-start/server";
import { createDb } from "~/server/db";

export default createStartServer({
  async createContext({ request, platform }) {
    return {
      db: createDb(platform.env.DATABASE_URL),
      requestId: crypto.randomUUID(),
    };
  },
});
```

没有 `src/entry-server.ts` 时，框架使用默认 entry：空 `locals`、执行匹配/loader/渲染并返回响应。用户创建 entry 时只覆盖 context、错误上报和少量 server hooks；Nitro renderer、HTML shell 与 server 入口仍由框架生成。

loader 执行规则：

- matched routes 按父到子执行。
- 每个 route 先执行 `beforeLoad`，再执行 `loader`。
- 父 route 失败时，子 route 不执行。
- 兄弟 route 的并发不是首版公共语义；用户可在单个 loader 内使用 `Promise.all()`。
- 不公开 loader 依赖声明、loader DAG、拓扑排序和 `parentData` 机制。

## 11. Payload、Seroval 与流式数据

首屏 HTML 包含带 nonce 的最小 route payload：

```ts
interface StartPayload {
  version: 1;
  buildId: string;
  manifestRevision: string;
  url: string;
  matches: Array<{
    routeId: string;
    params: Record<string, string>;
    search: unknown;
    beforeLoad?: unknown;
    loader?: unknown;
    error?: SerializedRouteError;
  }>;
}
```

序列化规则：

- 使用 `seroval` + `seroval-plugins/web`。
- 默认安全 JSON/cross-reference 模式。
- 默认不使用生产 `eval()` 恢复模式。
- 支持 Web 类型：`Request`、`Response`、`Headers`、`FormData`、`URL`、`ReadableStream` 等需要通过 Web plugins 明确处理。
- 拒绝函数、DOM 节点、未注册 class instance、秘密对象、不可控原型对象。
- 设置 payload version、最大字节数、最大深度、最大 deferred chunk 数。
- 对 `</script>`、原型污染 key、循环引用、超大对象、错误对象泄密建立测试。

`defer(promise)` 不阻塞 shell。server 为 deferred value 分配 opaque id，通过安全脚本 chunk 或 `text/x-essor-data` data stream 发送；client 只在对应 Essor Suspense 边界恢复。连接关闭时 root `AbortSignal` 取消未完成 deferred。

hydration 必须先校验 payload version、build id 与 manifest revision。不匹配时执行 document navigation，不能用可能错误的数据硬 hydrate。

## 12. 数据执行器、缓存与 Data Endpoint

Start 自己实现请求级数据执行器，不复用 router 的 SPA LRU。每次页面请求创建 `RouteExecution`：

```ts
export interface StartRequestContext<TLocals = Record<string, unknown>> {
  request: Request;
  params: Readonly<Record<string, string>>;
  search: URLSearchParams;
  signal: AbortSignal;
  locals: TLocals;
  routeContext: Readonly<Record<string, unknown>>;
  response: ResponseBuilder;
  route: StartRouteMatch;
}

export interface RouteCachePolicy {
  maxAge?: number;
  staleTime?: number;
  tags?: readonly string[];
  vary?: (ctx: StartRequestContext) => Record<string, string>;
}
```

loader 默认只在本次 request 内去重，不跨用户、不跨请求共享。只有 route 显式声明 `cache` 时，Start 才把 key 与 policy 交给 Nitro `defineCachedFunction`/`defineCachedHandler` 或 Nitro storage。

cache key 组成：

- route id
- 规范化 params/search
- build revision
- `vary(ctx)` 输出
- locale/runtime partition

含身份的 loader 必须把用户分区键放入 `vary`。缓存写入只发生在 loader 成功、可安全序列化且请求未取消之后。

客户端导航走内部 data endpoint：

```text
GET /_essor/data?url=<encoded-url>&rev=<manifest-revision>
```

endpoint 使用同一 route executor，返回版本化 Seroval payload。返回 `409` 表示 manifest 过期，client 回退 document navigation。用户不直接调用该 URL；Start 的 Link、preload、navigation runtime 协调 data request 与 `router.push()`/`router.preloadRoute()`。

## 13. Response 合并与 HTTP 语义

页面嵌套路由都可能贡献 status、headers、cookie。`ResponseBuilder` 只是 Start 的响应合并状态，最终写入 Nitro/H3 `Response`。

```ts
export interface ResponseBuilder {
  setStatus(status: number): void;
  setHeader(name: string, value: string): void;
  appendHeader(name: string, value: string): void;
  cookie(name: string, value: string, options?: CookieOptions): void;
  redirect(url: string, status?: 301 | 302 | 303 | 307 | 308): never;
}
```

合并规则：

- `Set-Cookie` 使用 Nitro/H3 append 语义。
- 安全响应头由外向内只允许补缺。
- `Cache-Control` 取最私有、最短有效生命周期。
- 最深成功 route 可设置成功 status。
- redirect、notFound、未处理异常覆盖普通 status。
- body 已开始流式输出后再改 headers 是开发期错误。

## 14. Head、SEO 与 Unhead v3

Head 完整使用 Unhead v3。Start 不维护自己的 title/meta/link/script 合并、去重、排序或 DOM renderer。

服务端：

```ts
import { createHead, renderSSRHead } from "unhead/server";

const head = createHead();
// route head(ctx) 与组件 useHead() 都注册到此 request 独立实例
const rendered = renderSSRHead(head);
```

客户端：

```ts
import { createHead as createClientHead } from "unhead/client";

const head = createClientHead();
```

SSR 注入必须处理全部区域：

- `headTags`
- `htmlAttrs`
- `bodyAttrs`
- `bodyTagsOpen`
- `bodyTags`

约束：

- 每个 SSR request 必须创建独立 head instance，不能跨请求共享。
- `renderSSRHead()` 在 Unhead v3 是同步 API，不使用旧式 `await renderSSRHead()`。
- server 与 client 必须使用各自子路径入口，避免错误 bundle。
- 客户端路由离开时 dispose 过期 entries，防止 stale canonical/meta/script 残留。
- 流式 SSR 后续使用 `unhead/stream/server` 与 `unhead/stream/client`，禁止自行拼 late head tags。
- 用户控制的描述、URL、JSON-LD、script 输入交给 Unhead 安全能力与 Start schema 校验，Start 不手写 HTML escaping。

测试范围：

- 嵌套 layout/page title template。
- description 与 canonical 替换。
- `html`/`body` attrs。
- nonce script。
- SSR/hydration 一致性。
- 客户端导航后标签清理。
- deferred/Suspense streaming 后 head 一致性。

参考来源：

- <https://github.com/unjs/unhead/blob/main/packages/unhead/package.json>
- <https://github.com/unjs/unhead/tree/main/packages/unhead/src/server>
- <https://github.com/unjs/unhead/tree/main/packages/unhead/src/client>
- <https://unhead.unjs.io/v3>

## 15. Server Functions 与 Actions

Server Functions 用于组件触发的 RPC 形 mutation；route action 用于页面表单和 URL 可寻址 mutation。二者共享认证、CSRF、输入验证、错误处理和缓存失效规则。

```ts
// src/server/comments.ts
import { createServerFn, invalidateTag } from "essor-start/server";

export const createComment = createServerFn({ method: "POST" })
  .input(commentSchema)
  .handler(async ({ data, locals }) => {
    const comment = await locals.comments.create(data);
    invalidateTag("comments");
    return comment;
  });
```

编译器职责：

- 为每个 server function 生成稳定 build-time id。
- client import 替换为 proxy。
- server manifest 注册真实 handler。
- client bundle 不包含 handler 实现。
- handler id 必须来自 manifest，禁止根据请求动态 import 任意文件。

安全基线：

- 只允许显式 method，mutation 默认 POST。
- 校验 content type、Origin、CSRF token、请求体大小、执行 timeout。
- 输入在访问 `locals` 前完成 schema 验证。
- 输出经过 Seroval 安全序列化验证。
- 401/403/400/500 结构化返回，生产不返回 stack、headers、cookie、SQL 错误或内部文件路径。
- 支持 `Idempotency-Key`，但业务幂等由应用实现。

选择规则：

| 场景                                         | 使用                                  | 理由                                   |
| -------------------------------------------- | ------------------------------------- | -------------------------------------- |
| `<form method="post">`、渐进增强、需要重定向 | route `action`                        | 无 JavaScript 仍可提交                 |
| 组件按钮触发的小 mutation                    | `createServerFn`                      | 客户端 proxy 有输入/返回类型           |
| 第三方 webhook、文件下载、公开 API           | Nitro `server/api` 或 `server/routes` | 需要完整 HTTP 方法、headers、body 控制 |
| 首屏读取与导航读取                           | route `loader`                        | 自动 SSR、hydration 和 data endpoint   |

## 16. Middleware、API Routes 与 Nitro Server Routes

Start 不新增路由目录里的 middleware 或 HTTP handler 协议。跨切面请求能力使用 Nitro：

```text
server/middleware/session.ts
server/api/articles/[id].get.ts
server/routes/webhooks/github.post.ts
```

Start renderer 会读取 Nitro/H3 event、runtime config、cookies、headers 和 platform bindings，并把必要信息放入 `StartRequestContext.locals`。页面 loader 与 Nitro server route 之间不共享页面 JSON 数据；需要共享业务逻辑时放入普通 server module。

middleware 约束：

- 认证、locale、request id、CSP nonce、日志等放在 Nitro middleware 或 Start context hook。
- middleware 不应隐藏 route data。
- middleware 必须尊重 `AbortSignal`。
- session、数据库连接、response builder 不能存入模块单例。

## 17. 渲染模式、Route Rules 与 ISR

默认模式是动态 SSR。没有 route rule 的页面绝不隐式进入持久缓存。

```ts
export const route = defineRoute({
  render: "ssr", // "ssr" | "static" | "isr" | "spa"
  revalidate: 60,
  prerender: () => ["/articles/1", "/articles/2"],
});
```

| 模式     | 构建时                                    | 请求时                    | 适用                     |
| -------- | ----------------------------------------- | ------------------------- | ------------------------ |
| `ssr`    | 构建代码与 manifest                       | 每次执行 request pipeline | 登录态、实时、个性化页面 |
| `static` | 通过同一 server handler 生成 HTML/payload | 静态文件直接返回          | 稳定公开内容             |
| `isr`    | 先 prerender，生成 revalidate 元数据      | 命中旧产物并受控再验证    | 可接受短暂陈旧的公开内容 |
| `spa`    | 只产出 app shell 与 client chunk          | 不执行页面 SSR            | 纯客户端隔离页面         |

ISR 不由 Start 自己用内存 `setTimeout` 实现。Start 将 route render/cache/revalidate 编译为 Nitro route rules 与 cache policy，使用 Nitro storage、SWR、single-flight 和 `event.waitUntil` 语义。目标 preset 没有持久 storage 或后台能力时，`render: "isr"` 在构建期报错或标记实验性。

## 18. 静态资源、图片、字体与脚本

静态资源由 Vite hash 与 asset manifest 管理。SSR 根据 client manifest 注入当前 route 的 CSS、entry module 与安全 `modulepreload`。

首版必须保证：

- 普通 Vite asset 在 SSR/CSR/SSG URL 一致。
- CSS 顺序稳定，避免 hydration 后样式抖动。
- public base path 与 Nitro public assets 一致。
- client manifest 不泄漏 server 路径或环境变量。

后续增强：

- `<StartImage>`：尺寸推导、格式转换、远程域名白名单、responsive `srcset`、provider 选择。
- 字体优化：本地 font manifest、preload、display 策略。
- 脚本策略：before/after hydration、worker、nonce、CSP。
- sitemap/robots/OpenGraph：由 route manifest、head metadata 与 Nitro server route 生成。

图片二进制处理优先使用 `sharp` 或平台 provider，不自研编码器。

## 19. 国际化

最小模型是 locale strategy：

- `prefix`：`/zh/...`
- `domain`：不同域名对应 locale
- `request`：从 header/cookie/session 决定

locale 解析发生在 route match 之前，结果进入 `locals.locale` 与 route data cache key。静态路径、canonical、hreflang、redirect 和 sitemap 使用同一 locale manifest。没有明确 locale 配置时，Start 不隐式重定向，避免 SEO 和缓存键不一致。

## 20. 开发、构建与部署

最小配置：

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { essorStart } from "essor-start/vite";

export default defineConfig({
  plugins: [essorStart()],
});
```

开发流程：

1. 读取 `essor-start.config.ts` 与 Vite 配置。
2. 调用现有 unplugin 扫描 `src/routes`，生成 `RouteNamedMap` 和 route tree。
3. 分析 route exports，生成 client/server manifests。
4. 生成 server function manifest 与 RPC handler。
5. 注册 Nitro dev server 与 Start renderer。
6. Route module 修改时只失效相关 manifest 和模块，尽量不重启整个应用。

生产构建：

1. 创建一次不可变 `StartBuildContext`。
2. 生成 route/client/server/asset/server-function manifests 与类型声明。
3. 将 renderer、data endpoint、server function RPC 注册到 Nitro。
4. Nitro/Vite 构建 client bundle。
5. Nitro 构建 server bundle。
6. Nitro 对 `static`/`isr` route 执行 prerender。
7. 输出标准 `.output/`。

产物：

```text
.essor/
  routes.manifest.json
  client.manifest.json
  server.manifest.json
  server-functions.manifest.json
  asset.manifest.json
  types/routes.d.ts
.output/
  public/
  server/
  nitro.json
```

manifest 不得包含源码绝对路径、环境变量、数据库 URL、server function 实现或私有平台 binding。

## 21. 环境变量与 Runtime Config

规则：

- 只有 `PUBLIC_` 前缀变量可进入 client bundle。
- 私有变量只通过 Nitro `runtimeConfig` 或 server context 读取。
- shared route module 顶层读取无前缀 `import.meta.env` 是编译错误。
- Cloudflare/Vercel/Node 专有全局对象不得传播到通用业务模块；通过 Start context 暴露经过类型筛选的能力。

## 22. 可观测性、错误与安全

每个 request/transition 产生 trace id。Start 记录 match、loader 时间、缓存命中、取消、render 首字节、完成时间和错误分类。默认日志不得记录 Authorization、Cookie、表单字段、loader 原始结果或秘密。

```ts
type StartEvent =
  | {
      type: "request:start";
      requestId: string;
      method: string;
      pathname: string;
    }
  | {
      type: "route:load";
      requestId: string;
      routeId: string;
      duration: number;
      cache: "hit" | "miss";
    }
  | { type: "render:first-byte"; requestId: string; duration: number }
  | { type: "request:end"; requestId: string; status: number; duration: number }
  | {
      type: "request:error";
      requestId: string;
      routeId?: string;
      error: unknown;
    };
```

错误分类：

- redirect/notFound：控制流，不报警。
- 输入/认证错误：400/401/403，结构化返回。
- route boundary 可恢复错误：最近 error boundary 显示，附 request id。
- 基础设施错误：通用 500，server 记录原始异常。

安全发布检查表：

- client bundle 不含 `node:*`、私有环境变量、数据库连接字符串、server function 实现或 stack trace。
- mutation 有 method 限制、输入大小限制、timeout、Origin/CSRF、认证测试。
- hydration payload 通过 Seroval 安全序列化、nonce/CSP、`</script>`、原型污染和循环对象测试。
- data endpoint 不回显 headers、cookie、表单、SQL/ORM 错误或内部文件路径。
- Nitro/preset、compiler transform、序列化变更必须跑安全 E2E。

## 23. 必须具备的元框架能力

| 能力             | 负责层                    | 默认行为                          | 验收                                  |
| ---------------- | ------------------------- | --------------------------------- | ------------------------------------- |
| 文件路由与类型   | unplugin + Start compiler | `src/routes` 自动生成 tree 与类型 | 类型正反例、HMR、manifest snapshot    |
| SSR              | Start server + Essor SSR  | GET 默认 SSR                      | 首屏 E2E、错误边界、redirect/404      |
| Hydration        | Start client              | 使用 payload 恢复                 | manifest mismatch reload              |
| Loader           | Start data runtime        | 父到子执行                        | cancel、error、payload 去重           |
| Actions          | Start server              | 表单 mutation                     | CSRF、redirect、invalidate            |
| Server Functions | compiler + server runtime | 显式 `createServerFn`             | client proxy、server-only bundle 检查 |
| API routes       | Nitro                     | `server/api`/`server/routes`      | method、headers、body、routeRules     |
| 缓存             | Nitro cache/storage       | 默认 request scoped               | tags、vary、revalidate                |
| Head/SEO         | Unhead                    | route head + component useHead    | SSR/client 一致                       |
| 预渲染/ISR       | Nitro routeRules/storage  | 显式声明                          | Node + Worker preset tests            |
| 静态资源         | Vite + Nitro public       | hash assets                       | CSS/modulepreload/base path           |
| 部署             | Nitro presets             | Node baseline                     | preset contract tests                 |
| 可观测性         | Start hooks + Nitro hooks | 脱敏事件                          | request id、timing、error             |

## 24. 实施路线图

| 阶段 | 交付                                                                        | 必须通过                                         |
| ---- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| M0   | Nitro renderer + Essor SSR + Unhead + Seroval POC，Node preset              | 单页面 SSR、head 注入、payload 恢复              |
| M1   | 现有 unplugin 生成 client/server manifests                                  | 嵌套路由、404、redirect、server-only bundle 检查 |
| M2   | 父到子 loader、hydration payload、data endpoint、cancel/prefetch/errors     | 首屏不二次请求、客户端导航、错误边界             |
| M3   | actions、Server Functions、FormData、redirect、CSRF、tag invalidation       | 表单 E2E、RPC E2E、安全负例                      |
| M4   | static/ISR route rules、Worker preset、observability、security/bundle gates | Nitro preset contract tests                      |
| M5   | `useAsyncData`、image provider、WebSocket、tasks、OpenAPI                   | 与 route data store/Nitro 能力统一               |

第一个可发布版本定义：

- 同一 demo 在 Nitro Node preset 和一个 Worker preset 上运行。
- SSR 首屏、客户端导航、嵌套 data/error、表单 action、redirect、deferred、prerender 都有 E2E。
- `essor-router` 现有 SPA API 无破坏性回归。
- 生产 build 不含 server-only 代码或秘密。
- 文档包含限制、迁移路径、测试命令和部署说明。

## 25. Router 侧优化边界

为了让 Start 成为 router 的上层能力，而不是压垮 router，router 侧只做必要优化：

- 保持 matcher、导航状态机、typed route locations 稳定。
- 优化 route match 性能、路径解析、query/stringify、取消语义和错误诊断。
- 暴露足够的 route manifest/类型生成扩展点给 Start。
- 不引入 Nitro、H3、Unhead、Seroval、server context、cache storage 或 deployment preset。
- 不为了 Start 增加复杂的 loader DAG、服务端响应合并或 HTTP handler。

这样 `essor-router` 仍然是一个强大、清晰、高性能的 router；`essor-start` 则在它之上提供完整元框架能力。
