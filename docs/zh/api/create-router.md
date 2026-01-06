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
createRouter({
  history: 'history', // HTML5 History
  // history: 'hash',  // Hash 模式
  // history: 'memory', // Memory 模式
  routes: [],
});

// 或使用工厂函数
import { createWebHistory, createWebHashHistory, createMemoryHistory } from 'essor-router';

createRouter({
  history: createWebHistory('/base/'),
  routes: [],
});
```

### routes

- **类型：** `RouteRecordRaw[]`
- **必填：** 是

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
  props?: boolean | Object | Function;
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
