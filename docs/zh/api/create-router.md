# createRouter

创建路由器实例。

## 签名

```tsx
function createRouter(options: RouterOptions): Router
```

## 选项

### history

- **类型：** `'history' | 'hash' | 'memory' | RouterHistory`
- **必填：** 是

要使用的历史模式：

```tsx
// 字符串简写
// 或使用工厂函数
import { createMemoryHistory, createWebHashHistory, createWebHistory } from 'essor-router';

createRouter({
  history: 'history', // HTML5 History
  // history: 'hash',  // Hash 模式
  // history: 'memory', // Memory 模式
  routes: [],
});

createRouter({
  history: createWebHistory('/base/'),
  routes: [],
});
```

### routes

- **类型：** `RouteRecordRaw[]`
- **必填：** 否(默认 `[]`)

初始路由记录数组：

```tsx
createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
  ],
});
```

提供了 `resolver` 时,记录通常由 resolver 自身携带,`routes` 可整体省略。如果两者
都传入,`routes` 仍会被运行时 matcher 使用以支持 `addRoute`、`removeRoute`、
`hasRoute`、`getRoutes` 和预渲染路径收集;`resolver` 只接管路径匹配。

### resolver

- **类型：** `FixedRouteResolver`
- **必填：** 否

由 `unplugin-essor-router` 构建期生成的 resolver,通过虚拟模块
`essor-router/auto-resolver` 暴露。传入后,导航时的路径匹配交由编译期的查找表
完成,跳过运行期的排序 matcher:

```tsx
import { resolver } from 'essor-router/auto-resolver';
import { createRouter, createWebHistory } from 'essor-router';

const router = createRouter({
  history: createWebHistory(),
  resolver,
});
```

对于 SSR 或测试场景,也可以用 `createFixedResolver()` 手工组装 — 详见
[文件路由指南](/zh/guide/advanced/file-based-routing-unplugin)。

### base

- **类型：** `string`
- **默认值：** `'/'`

所有路由的基础 URL：

```tsx
createRouter({
  history: 'history',
  base: '/app/',
  routes: [],
});
```

### parseQuery

- **类型：** `(query: string) => LocationQuery`
- **默认值：** 内置解析器

自定义查询字符串解析器：

```tsx
import qs from 'qs';

createRouter({
  history: 'history',
  parseQuery: qs.parse,
  routes: [],
});
```

### stringifyQuery

- **类型：** `(query: LocationQueryRaw) => string`
- **默认值：** 内置序列化器

自定义查询字符串序列化器：

```tsx
import qs from 'qs';

createRouter({
  history: 'history',
  stringifyQuery: qs.stringify,
  routes: [],
});
```

### linkActiveClass

- **类型：** `string`
- **默认值：** `'router-link-active'`

RouterLink 激活时的默认类名：

```tsx
createRouter({
  history: 'history',
  linkActiveClass: 'active',
  routes: [],
});
```

### linkExactActiveClass

- **类型：** `string`
- **默认值：** `'router-link-exact-active'`

RouterLink 精确激活时的默认类名：

```tsx
createRouter({
  history: 'history',
  linkExactActiveClass: 'exact-active',
  routes: [],
});
```

### strict

- **类型：** `boolean`
- **默认值：** `false`

启用严格路径匹配（尾部斜杠敏感）：

```tsx
createRouter({
  history: 'history',
  strict: true,
  routes: [],
});
```

### sensitive

- **类型：** `boolean`
- **默认值：** `false`

启用大小写敏感的路径匹配：

```tsx
createRouter({
  history: 'history',
  sensitive: true,
  routes: [],
});
```

## 历史工厂函数

### createWebHistory

创建 HTML5 历史：

```tsx
import { createWebHistory } from 'essor-router';

const history = createWebHistory();
const history = createWebHistory('/base/');
```

### createWebHashHistory

创建基于哈希的历史：

```tsx
import { createWebHashHistory } from 'essor-router';

const history = createWebHashHistory();
const history = createWebHashHistory('/base/');
```

### createMemoryHistory

创建内存历史（不改变 URL）：

```tsx
import { createMemoryHistory } from 'essor-router';

const history = createMemoryHistory();
const history = createMemoryHistory('/base/');
```

## 路由记录

### RouteRecordRaw

```tsx
interface RouteRecordRaw {
  path: string;
  name?: string;
  component?: Component;
  components?: Record<string, Component>;
  redirect?: string | Location | Function;
  alias?: string | string[];
  children?: RouteRecordRaw[];
  beforeEnter?: NavigationGuard | NavigationGuard[];
  beforeLeave?: NavigationGuard | NavigationGuard[];
  meta?: RouteMeta;
  props?: boolean | object | Function;
  sensitive?: boolean;
  strict?: boolean;
}
```

## 示例

```tsx
import { createRouter, createWebHistory } from 'essor-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { title: '首页' },
    },
    {
      path: '/user/:id',
      name: 'user',
      component: User,
      props: true,
      children: [
        { path: '', component: UserHome },
        { path: 'profile', component: UserProfile },
      ],
    },
    {
      path: '/admin',
      component: Admin,
      beforeEnter: (to, from, next) => {
        if (!isAdmin()) next('/forbidden');
        else next();
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
    },
  ],
  linkActiveClass: 'active',
  linkExactActiveClass: 'exact-active',
});

export default router;
```
