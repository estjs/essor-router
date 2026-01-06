# 路由配置

路由被定义为路由记录数组。每个路由记录将 URL 路径映射到组件。

## 基础路由

```tsx
import { createRouter } from 'essor-router';

const router = createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/contact', component: Contact },
  ],
});
```

## 路由记录属性

### path

要匹配的 URL 路径模式。

```tsx
{ path: '/users', component: Users }
```

### component

路由匹配时要渲染的组件。

```tsx
{ path: '/about', component: About }
```

### components

对于命名视图，指定多个组件：

```tsx
{
  path: '/dashboard',
  components: {
    default: DashboardMain,
    sidebar: DashboardSidebar,
  },
}
```

### name

路由的唯一名称：

```tsx
{
  path: '/user/:id',
  name: 'user',
  component: User,
}
```

### redirect

重定向到另一个位置：

```tsx
// 字符串重定向
{ path: '/home', redirect: '/' }

// 命名路由重定向
{ path: '/home', redirect: { name: 'homepage' } }

// 函数重定向
{
  path: '/search',
  redirect: (to) => {
    return { path: '/results', query: { q: to.params.searchText } };
  },
}
```

### alias

同一路由的替代路径：

```tsx
{ path: '/users', component: Users, alias: '/people' }

// 多个别名
{ path: '/users', component: Users, alias: ['/people', '/members'] }
```

### meta

附加到路由的自定义数据：

```tsx
{
  path: '/admin',
  component: Admin,
  meta: {
    requiresAuth: true,
    roles: ['admin'],
  },
}
```

### children

嵌套路由：

```tsx
{
  path: '/user/:id',
  component: User,
  children: [
    { path: '', component: UserHome },
    { path: 'profile', component: UserProfile },
    { path: 'posts', component: UserPosts },
  ],
}
```

### beforeEnter

路由独享的导航守卫：

```tsx
{
  path: '/admin',
  component: Admin,
  beforeEnter: (to, from, next) => {
    if (!isAdmin()) {
      next('/forbidden');
    } else {
      next();
    }
  },
}
```

### props

将路由参数作为 props 传递给组件：

```tsx
// 布尔模式 - 将所有参数作为 props 传递
{ path: '/user/:id', component: User, props: true }

// 对象模式 - 静态 props
{ path: '/about', component: About, props: { newsletter: true } }

// 函数模式 - 动态 props
{
  path: '/search',
  component: Search,
  props: (route) => ({ query: route.query.q }),
}
```

## 完整示例

```tsx
const routes = [
  // 基础路由
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  
  // 带 meta 的路由
  {
    path: '/about',
    name: 'about',
    component: About,
    meta: { title: '关于我们' },
  },
  
  // 带 props 的动态路由
  {
    path: '/user/:id',
    name: 'user',
    component: User,
    props: true,
  },
  
  // 嵌套路由
  {
    path: '/dashboard',
    component: Dashboard,
    children: [
      { path: '', name: 'dashboard-home', component: DashboardHome },
      { path: 'settings', name: 'dashboard-settings', component: DashboardSettings },
    ],
  },
  
  // 命名视图
  {
    path: '/layout',
    components: {
      default: Main,
      sidebar: Sidebar,
      header: Header,
    },
  },
  
  // 重定向
  { path: '/old-path', redirect: '/new-path' },
  
  // 别名
  { path: '/users', component: Users, alias: '/people' },
  
  // 受保护的路由
  {
    path: '/admin',
    component: Admin,
    meta: { requiresAuth: true },
    beforeEnter: (to, from, next) => {
      if (!isAuthenticated()) {
        next('/login');
      } else {
        next();
      }
    },
  },
  
  // 捕获所有 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
];
```

## 路由匹配优先级

路由按定义顺序匹配。更具体的路由应该定义在不太具体的路由之前：

```tsx
const routes = [
  { path: '/user/new', component: UserNew },      // 具体路径优先
  { path: '/user/:id', component: User },         // 动态路径其次
  { path: '/:pathMatch(.*)*', component: NotFound }, // 捕获所有最后
];
```
