# 重定向和别名

## 重定向

重定向允许你自动从一个路由导航到另一个路由。

### 基础重定向

```tsx
const routes = [
  { path: '/home', redirect: '/' },
  { path: '/', component: Home },
];
```

当用户访问 `/home` 时，会被重定向到 `/`。

### 重定向到命名路由

```tsx
const routes = [
  { path: '/home', redirect: { name: 'homepage' } },
  { path: '/', name: 'homepage', component: Home },
];
```

### 动态重定向

使用函数进行动态重定向：

```tsx
const routes = [
  {
    path: '/search/:searchText',
    redirect: (to) => {
      return { path: '/results', query: { q: to.params.searchText } };
    },
  },
];
```

### 保留查询参数的重定向

```tsx
const routes = [
  {
    path: '/old-search',
    redirect: (to) => {
      return { path: '/search', query: to.query };
    },
  },
];
```

### 嵌套路由中的重定向

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    redirect: '/dashboard/overview', // 重定向到子路由
    children: [
      { path: 'overview', component: Overview },
      { path: 'stats', component: Stats },
    ],
  },
];
```

## 别名

别名为路由提供额外的路径，而不改变 URL。

### 基础别名

```tsx
const routes = [
  { path: '/users', component: Users, alias: '/people' },
];
```

`/users` 和 `/people` 都会渲染 `Users` 组件，但 URL 保持访问时的样子。

### 多个别名

```tsx
const routes = [
  {
    path: '/users',
    component: Users,
    alias: ['/people', '/members', '/team'],
  },
];
```

### 带参数的别名

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    alias: '/profile/:id',
  },
];
```

`/user/123` 和 `/profile/123` 都渲染相同的组件。

### 嵌套路由别名

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    children: [
      {
        path: 'settings',
        component: Settings,
        alias: '/settings', // 绝对别名
      },
    ],
  },
];
```

`/dashboard/settings` 和 `/settings` 都渲染 Settings 组件。

## 重定向 vs 别名

| 特性 | 重定向 | 别名 |
|------|--------|------|
| URL 变化 | 是 | 否 |
| 导航守卫 | 触发两次 | 触发一次 |
| 使用场景 | 废弃的 URL、认证 | SEO、用户便利 |

### 何时使用重定向

- 将内容移动到新 URL
- 认证流程（重定向到登录）
- 废弃的路由
- 默认子路由

```tsx
// 重定向废弃的 URL
{ path: '/old-page', redirect: '/new-page' }

// 重定向到登录
{
  path: '/dashboard',
  redirect: (to) => {
    if (!isAuthenticated()) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }
    return false; // 不重定向
  },
}
```

### 何时使用别名

- 同一内容的多个 URL
- SEO 友好的 URL
- 用户便利

```tsx
// SEO 友好的别名
{ path: '/products/:id', component: Product, alias: '/p/:id' }

// 便利别名
{ path: '/settings/account', component: AccountSettings, alias: '/account' }
```

## 实际示例

### 认证重定向

```tsx
const routes = [
  {
    path: '/login',
    component: Login,
  },
  {
    path: '/dashboard',
    component: Dashboard,
    beforeEnter: (to, from, next) => {
      if (!isAuthenticated()) {
        next({ path: '/login', query: { redirect: to.fullPath } });
      } else {
        next();
      }
    },
  },
];

// 登录后重定向回来
function Login() {
  const router = useRouter();
  const route = useRoute();
  
  const handleLogin = async () => {
    await login();
    const redirect = route.query.redirect || '/dashboard';
    router.push(redirect);
  };
}
```

### 语言重定向

```tsx
const routes = [
  {
    path: '/',
    redirect: () => {
      const lang = navigator.language.split('-')[0];
      return `/${lang}`;
    },
  },
  { path: '/en', component: EnglishHome },
  { path: '/zh', component: ChineseHome },
];
```

### 404 重定向

```tsx
const routes = [
  // ... 其他路由
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
  {
    path: '/404',
    component: NotFound,
  },
];
```
