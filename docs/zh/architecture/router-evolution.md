---
sidebar_label: Router 演进设计
---

# Essor Router 稳定性与优化设计

> 状态：设计提案。`essor-router` 是独立、稳定的 Essor SPA 路由器。`essor-start` 只能消费它已有且文档化的公开 API；SSR、数据、缓存、Server Functions、部署与任何 Start 专用协同均在 Start 包内实现。

## 1. 边界优先

当前 router 已经具备成熟功能：路径排序与参数匹配、HTML5/Hash/Memory history、导航守卫、异步组件、文件路由、类型生成、预取、导航取消、滚动恢复以及动态路由。下一阶段的首要目标不是为了元框架重构它，而是在不扩大职责和公开 API 的前提下，让代码更短、更清楚、更快。

Router 只负责：

1. URL 与 `RouteRecordRaw` 的匹配、规范化和字符串化。
2. 浏览器 history、`currentRoute`、导航守卫、重定向、取消与滚动恢复。
3. Essor 的 `RouterView`、`RouterLink`、`useRoute`、`useRouter` 与 `preloadRoute()`。
4. 文件路由与类型路由的现有编译产物接入。

Router 明确不负责：`Request`/`Response`、SSR、hydration、cookies、服务端/跨请求缓存、数据序列化、Server Functions、HTTP endpoints、环境变量、部署 adapter、数据库、认证或 Start 生命周期钩子。Start 若需要这些能力，必须在自己的 runtime 里实现，不能向 router 新增私有控制入口。

```text
essor-router
  matcher + history + browser navigation + components + public composables
                         ^
                         | 仅公开 API：resolve/push/replace/currentRoute/preloadRoute
                         |
essor-start
  route modules + data runtime + SSR + hydration + actions + adapters
```

## 2. 保持不变的公开契约

| 能力           | 当前公开 API                                                                      | 稳定性原则                                 |
| -------------- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| 创建与 history | `createRouter`、`createWebHistory`、`createWebHashHistory`、`createMemoryHistory` | 不改变已有调用方式                         |
| 解析与导航     | `resolve`、`push`、`replace`、`go`、`back`、`forward`                             | 保持返回值、failure 类型和重定向语义       |
| 路由状态       | `currentRoute`、`useRoute`、`useRouter`                                           | 不把内部 transition 或组件实例暴露为新状态 |
| 预加载         | `preloadRoute`、`usePreloadRoute`、`RouterLink` 的 prefetch                       | 保持单次去重、失败可重试、可取消           |
| 守卫           | `beforeEach`、`beforeResolve`、`afterEach`、组件守卫                              | 保持既有顺序与 `next`/return 兼容性        |
| 路由表         | `addRoute`、`removeRoute`、`clearRoutes`、`getRoutes`                             | 动态路由与 fixed resolver 继续共存         |

不新增 `RouterExtension`、通用事件总线、Start 专用 `prefetch` 别名、server context 或新的 route DSL。若优化需要内部辅助函数、私有类型或更小的模块，可以新增但不导出。

## 3. Start 如何使用稳定 Router

Start 的客户端 runtime 创建普通 router，并只使用上表 API：首屏 hydration 由 Start 自己读取 payload；后续导航由 Start 自己调用 `router.push()`；对链接的代码预热继续调用 `router.preloadRoute()`。Start 的 data endpoint、请求取消、缓存与错误状态存放在 Start 自己的 store 中，不写入 router 的 LRU、route record 或 `currentRoute`。

Start 如需在导航前读取数据，应在自己的 link/navigation 包装组件中先启动 data request，再调用 `router.push()`；失败时由 Start 自己决定显示 pending/error 或改为 document navigation。它不注册未文档化 hook，也不依赖 `navigator.ts`、matcher 内部 Map 或组件实例。

这会造成 Start 的客户端协调逻辑略多，但换来 router 的稳定性：普通 SPA 用户不会因 SSR、缓存协议或部署目标增加 bundle、类型或运行时分支。

## 4. 代码优化原则

优化必须可测量、局部且不改行为。当前 `core/router.ts` 负责 router 生命周期、history listener、resolver/matcher 选择、滚动和动态路由；`navigation/navigator.ts` 负责 location 解析、guards、导航提交、预加载和客户端 loader。它们文件较大，但先按“同一导航状态机的相邻职责”整理，不进行跨包或抽象层拆分。

### 4.1 优先级 P0：正确性与可读性

- 把每个导航阶段保留为命名的私有函数：resolve、guard、commit、scroll、preload；一个函数只写一个可变状态源。
- 用局部、单调递增的导航 token 统一判断过期导航；不改变公开 failure 类型，也不暴露 token。
- 将 `pendingLocation`、AbortController 和两类 LRU 缓存的所有权集中在 navigator，避免 router 与 navigator 双方修改同一状态。
- 固定 redirect、cancel、duplicate、guard error、lazy component error 的处理表，并以测试锁住顺序。
- 删除未使用的私有分支、重复类型转换和无法覆盖的防御代码；任何删除先由现有/新增测试证明。

### 4.2 优先级 P1：匹配与解析性能

- 保持 matcher 的预编译正则、排序结果与 fixed resolver 快速路径；不在 `resolve()` 中重建 route tree。
- 减少 hot path 的临时对象分配，但不以共享可变 route 对象换取微小收益。
- 将 runtime route 与生成 resolver 的选择逻辑封装为一个私有函数，明确“runtime 优先、生成路由回退”的条件。
- 针对 100、1,000、10,000 条静态路由和含动态参数/查询的 URL 建立基准；只有 P95 明显回退才引入更复杂的数据结构。

### 4.3 优先级 P2：预加载与客户端 loader

- 保持现有 `preloadRoute()` 为唯一公开入口，复用异步组件与 route data 的 in-flight Promise。
- 缓存仅限单个浏览器 router 实例；key 为规范化后的 `fullPath`，失败和取消必须移除条目。
- 新导航取消旧 route data 时只 abort 对应 controller，不能清空无关的成功预加载。
- LRU 容量维持保守默认值；若需要可配置容量，只增加 `RouterOptions` 的可选数值字段，不改变调用流程。
- `RouterLink` 的 intent/render/viewport 行为保持现有退化逻辑，绝不引入网络、服务端或 Start 依赖。

## 5. 性能预算与验证

| 项目       | 门槛                                                  | 验证                        |
| ---------- | ----------------------------------------------------- | --------------------------- |
| 路径解析   | 1,000 条已编译路由 P95 不高于基线 10%                 | Node benchmark，冷/热两轮   |
| 命名解析   | 动态 params 与 query 的 P95 不高于基线 10%            | 固定请求集                  |
| 重复预加载 | 相同目标并发调用只加载一次                            | 可控 Promise 单测           |
| 导航取消   | 新导航后旧 loader signal 在一个 microtask 内 aborted  | fake timers 单测            |
| 内存       | 连续 10,000 次导航后 LRU 不超过配置上限               | 浏览器/Node heap smoke test |
| 包边界     | `essor-router` 不引入 server、Vite、HTTP 或序列化依赖 | bundle/import smoke test    |

性能报告必须给出修改前后数字、基准环境与路由集。不得因“可能更快”而改变 URL 编码、guard 顺序、redirect、history state 或错误语义。

## 6. 测试与重构流程

1. 先在现有测试旁加入失败用例，复现具体的竞态、泄漏或性能退化。
2. 做最小内部改动，只触及 matcher、navigator、router 或 LRU 中真正拥有该状态的文件。
3. 运行目标单测，再运行 router 全量单测、类型检查和相关 Playwright 用例。
4. 对 hot path 变更运行基准，并记录与基线差异。
5. 审查公开导出、`package.json` 依赖和构建产物，确保没有为 Start 新增依赖或 API。

必须覆盖：连续 push、popstate 回滚、guard redirect、重复导航、lazy component 拒绝、预加载失败重试、HMR 替换 resolver、动态 add/remove route、多个 router 实例和没有 `IntersectionObserver` 的预取退化。

## 7. 与 Start 的版本策略

Start 依赖 router 的已发布版本和公开 API，而不是仓库内部文件。它应声明最低 router 版本，并为 API 不足在 Start 内实现适配层。router 的 patch/minor 发布不得因为 Start 的 SSR、server function、cache 或 adapter 改动而增加依赖、改变 bundle 或破坏 SPA 用户；需要新公开 router 能力时，先证明它同样解决独立 SPA 问题，再单独 RFC 和发布。
