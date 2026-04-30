# essor-router 运行时审查与修复计划

针对 `packages/router/src` 做一次定向修复 + 优化 + 测试补强，聚焦真实存在的 bug、内存泄漏与可验证的性能/稳健性提升，不做大的架构重构。

## 一、明确发现的 Bug（计划修复）

1. **滚动恢复 key 用错** — `src/router.ts` 的 `handleScroll` 用 `getSavedScrollPosition(getScrollKey(to.fullPath, 0))`，但保存时 (`router/lifecycle.ts:83`) 用的是 `from.fullPath` + `info.delta`。结果保存的滚动位置永远取不出来。改为 `from.fullPath`，并把 `delta` 透传进来（参考 vue-router）。
2. **`matcher.removeRoute` 漏 index 守卫** — `src/matcher/index.ts:188-189` 走 by-name 分支时直接 `matchers.splice(matchers.indexOf(matcher), 1)`，若 matcher 因没有 components/name/redirect 而未被 `insertMatcher` 收录，`indexOf` 返回 `-1`，`splice(-1,1)` 会误删数组最后一项。补 `index > -1` 守卫。
3. **`lifecycle.init` 中 `toRaw` 误用** — `src/router/lifecycle.ts:184` `toRaw<any>(options.currentRoute) === START_LOCATION_NORMALIZED` 拿到的是 Signal 对象本身而不是当前值，恒为 false。改为读取 `options.currentRoute.value`（与上面 `started` 共同正确判断初始导航）。
4. **`destroy` 直接改写 Signal 私有字段** — `src/router/lifecycle.ts:213-225` 通过 `_value` / `_rawValue` 复位 currentRoute，跨 signals 版本极易失效。改为统一 `options.currentRoute.value = START_LOCATION_NORMALIZED`，把 try/catch 留作兜底。
5. **`useRoute` 浅拷贝残留旧 key** — `src/useApi.ts` 用 `assign(route, routeSignal.value)` 同步更新，路由切换后 `meta` / `params` 中已被移除的 key 不会消失。改为先清掉不在新值里的 key，再 assign。
6. **`collectPrerenderPaths` 返回模板路径** — `src/router.ts:303` 把 `/users/:id` 当作具体路径输出，预渲染清单实际无用。改为：动态参数路由从 `record.start.prerenderPaths` 或 `record.start.params` 读取实际 paths；无则跳过并 `__DEV__` 警告。

## 二、内存泄漏 / 资源回收（计划修复）

7. **`usePrefetch` 的 IntersectionObserver 不释放** — `src/router/usePrefetch.ts` 在 `viewport` 模式下创建 observer，命中前组件卸载就泄漏。改为：内部记录 observer 引用，并返回 `dispose()`；`RouterLink` 在 `onDestroy` 调用。
8. **预加载缓存无界增长** — `src/router/navigation.ts` 的 `preloadRouteCache` / `routeDataCache` 仅在 routes 增删时清空，长生命周期 SPA 会累积。加入可配置的 LRU 上限（默认 ~32）+ 失败/过期 TTL，并暴露 `clearPreload()`。
9. **`scrollPositions` 未清理** — `src/scrollBehavior.ts` 全局 Map 只在被读时 delete；用户一直前进不回退则累积。加个软上限（如 50 项的 FIFO 淘汰）。
10. **`RouterLink` 的 `routerLinkPrefetchId` 全局自增** — 改为 per-router 计数 + `Math.random` 后缀，避免跨 SSR/多实例冲突，同时方便测试。

## 三、稳健性 / 优化（计划修复）

11. **`RouterLink.useLink` 中 `hasPrevious`/`previousTo` 是死代码** — 删除以减小闭包占用。
12. **`RouterView` 的 outlet 创建放进浏览器分支** — `document.createElement` 在非浏览器环境会抛；与 `isBrowser` 一致地保护，方便 SSR 单元测试。
13. **`html5.ts` 的 `pauseState` 只能记一帧** — 多次连续 `go(_, false)` 时仅最近一次被忽略。改为 set 队列（小队列即可），与 vue-router 行为对齐。
14. **`navigation.runRouteDataHooks` 取消传播** — 当外部 navigation 被取消，loader 仍继续 `await`；通过 AbortController 传递给 `RouteLoaderContext.signal`（`experimental/runtime.ts` 已声明 `signal`，目前没注入）。
15. **`navigationGuards.registerGuard` 边界** — 在没有组件 scope 时调用 `onBeforeRouteLeave` 会让 `onDestroy` 抛错。加 `__DEV__` warn + early return。

## 四、测试补强

针对每条修复都加最小回归用例，落到对应已有 spec 文件，避免新建文件：

- `test/scrollBehavior.spec.ts` — 增 from-key 命中保存位置的回归。
- `test/matcher/*.spec.ts` — 增删 "无 component/无 name/无 redirect" 的中间记录后再删 root，断言其它路由未被误删。
- `test/router/navigation.spec.ts` — preload 缓存 LRU 行为；loader 取消时 signal.aborted 为 true。
- `test/router/usePrefetch.spec.ts` — 已有的 viewport 用例补 dispose 调用断言（IntersectionObserver.disconnect 在 dispose 时被调）。
- `test/useApi.spec.ts` — useRoute 跨路由切换后 stale meta key 被清空。
- `test/router.spec.ts` 或新增 `test/lifecycle.spec.ts` — 多次 init/destroy 后 currentRoute 正确复位，无需依赖 `_value`。
- `test/routerLink.spec.ts` — 卸载已挂载的 link 后 IntersectionObserver.disconnect 触发；prefetchId 在两个 router 实例间不冲突。

## 五、不打算动的部分（避免过度工程）

- 不重写 matcher/path 解析，不调整公共 API。
- 不引入新依赖、不动构建配置（tsup/vitest）。
- `experimental/runtime.ts` 仅在第 14 项需要时小动，类型不破坏。

## 六、执行顺序

1. 先补/调整测试，让失败用例锁定上述 bug（红）。
2. 按 §一→§二→§三 顺序最小化修复（绿）。
3. 跑 `pnpm --filter essor-router test` 与 `typecheck`，必要时 `coverage` 复核。
4. 若行为有用户可见变化（如预渲染列表语义），在 `packages/router/README*.md` 简短说明。

## 七、风险与回退

- 第 6 条更改了 `getPrerenderPaths` 输出语义，可能影响下游（unplugin/ts-plugin）。先 grep 调用点；若有依赖则保留旧语义并提供新方法 `getPrerenderEntries()`。
- 第 8 条引入 LRU，默认值需保守，避免影响现有 e2e。
- 第 14 条 AbortSignal 注入是**新增**字段，不破坏既有 loader；缺省不消费即可。
