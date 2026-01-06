# 路由元信息

路由元信息允许你为路由附加任意数据。

## 定义元信息

为路由添加 `meta` 属性：

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,
      roles: ['admin'],
      title: '管理后台',
    },
  },
  {
    path: '/public',
    component: PublicPage,
    meta: {
      requiresAuth: false,
      title: '公开页面',
    },
  },
];
```

## 访问元信息

### 在导航守卫中

```tsx
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});
```

### 在组件中

```tsx
import { useRoute } from 'essor-router';

function PageHeader() {
  const route = useRoute();
  
  return <h1>{route.meta.title}</h1>;
}
```

### 从匹配路由合并的元信息

使用嵌套路由时，元信息会从所有匹配的路由合并：

```tsx
const routes = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'users',
        component: UserManagement,
        meta: { roles: ['admin'] },
      },
    ],
  },
];

// 访问 /admin/users 时：
// route.meta = { requiresAuth: true, roles: ['admin'] }
```

检查任何匹配路由的元信息：

```tsx
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  // ...
});
```

## TypeScript 支持

扩展 `RouteMeta` 接口以获得类型安全：

```tsx
// types.d.ts
import 'essor-router';

declare module 'essor-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: string[];
    title?: string;
    transition?: string;
    keepAlive?: boolean;
  }
}
```

现在你可以获得自动补全和类型检查：

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: {
      requiresAuth: true,  // ✅ 类型检查
      roles: ['admin'],    // ✅ 类型检查
      invalid: true,       // ❌ 类型错误
    },
  },
];
```

## 常见用例

### 认证

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    component: Login,
    meta: { requiresAuth: false, guestOnly: true },
  },
];

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!getToken();
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else if (to.meta.guestOnly && isLoggedIn) {
    next('/dashboard');
  } else {
    next();
  }
});
```

### 基于角色的访问控制

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    meta: { roles: ['admin'] },
  },
  {
    path: '/editor',
    component: Editor,
    meta: { roles: ['admin', 'editor'] },
  },
];

router.beforeEach((to, from, next) => {
  const requiredRoles = to.meta.roles;
  
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = getCurrentUserRoles();
    const hasPermission = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasPermission) {
      next('/forbidden');
      return;
    }
  }
  
  next();
});
```

### 页面标题

```tsx
const routes = [
  { path: '/', component: Home, meta: { title: '首页' } },
  { path: '/about', component: About, meta: { title: '关于我们' } },
  { path: '/contact', component: Contact, meta: { title: '联系我们' } },
];

router.afterEach((to) => {
  const baseTitle = '我的应用';
  document.title = to.meta.title 
    ? `${to.meta.title} | ${baseTitle}` 
    : baseTitle;
});
```

### 页面过渡

```tsx
const routes = [
  { path: '/', component: Home, meta: { transition: 'fade' } },
  { path: '/about', component: About, meta: { transition: 'slide-left' } },
];

function App() {
  const route = useRoute();
  
  return (
    <div class={`transition-${route.meta.transition}`}>
      <RouterView />
    </div>
  );
}
```

### 面包屑

```tsx
const routes = [
  {
    path: '/',
    component: Home,
    meta: { breadcrumb: '首页' },
  },
  {
    path: '/products',
    component: Products,
    meta: { breadcrumb: '产品' },
    children: [
      {
        path: ':id',
        component: ProductDetail,
        meta: { breadcrumb: '产品详情' },
      },
    ],
  },
];

function Breadcrumbs() {
  const route = useRoute();
  
  const breadcrumbs = route.matched
    .filter(record => record.meta.breadcrumb)
    .map(record => ({
      name: record.meta.breadcrumb,
      path: record.path,
    }));
  
  return (
    <nav>
      {breadcrumbs.map((crumb, index) => (
        <span key={crumb.path}>
          {index > 0 && ' > '}
          <RouterLink to={crumb.path}>{crumb.name}</RouterLink>
        </span>
      ))}
    </nav>
  );
}
```

### 布局选择

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { layout: 'admin' },
  },
  {
    path: '/login',
    component: Login,
    meta: { layout: 'auth' },
  },
  {
    path: '/',
    component: Home,
    meta: { layout: 'default' },
  },
];

function App() {
  const route = useRoute();
  const layout = route.meta.layout || 'default';
  
  const layouts = {
    default: DefaultLayout,
    admin: AdminLayout,
    auth: AuthLayout,
  };
  
  const Layout = layouts[layout];
  
  return (
    <Layout>
      <RouterView />
    </Layout>
  );
}
```
