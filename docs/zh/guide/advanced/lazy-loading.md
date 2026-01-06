# 懒加载路由

懒加载允许你将应用拆分成更小的代码块，按需加载，从而改善初始加载时间。

## 基础懒加载

使用动态导入来懒加载路由组件：

```tsx
const routes = [
  {
    path: '/',
    component: Home, // 立即加载
  },
  {
    path: '/about',
    component: () => import('./pages/About'), // 按需加载
  },
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard'),
  },
];
```

## 工作原理

当用户导航到懒加载路由时：

1. 路由器检测到组件是返回 Promise 的函数
2. 从服务器获取代码块
3. 加载完成后渲染组件

```
用户点击 /dashboard
        │
        ▼
┌───────────────────┐
│ 从服务器获取      │
│ dashboard 代码块  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 解析并执行        │
│ JavaScript        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 渲染 Dashboard    │
│ 组件              │
└───────────────────┘
```

## 分组代码块

### 命名代码块（Webpack/Vite）

使用魔法注释命名代码块：

```tsx
const routes = [
  {
    path: '/admin',
    component: () => import(/* webpackChunkName: "admin" */ './pages/Admin'),
  },
  {
    path: '/admin/users',
    component: () => import(/* webpackChunkName: "admin" */ './pages/AdminUsers'),
  },
];
```

两个组件将被打包到名为 "admin" 的同一个代码块中。

### Vite 代码块命名

```tsx
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard'), // dashboard.[hash].js
  },
];
```

在 `vite.config.ts` 中配置：

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          admin: ['./src/pages/Admin', './src/pages/AdminUsers'],
        },
      },
    },
  },
});
```

## 加载状态

### 全局加载指示器

```tsx
router.beforeEach((to, from, next) => {
  showLoadingBar();
  next();
});

router.afterEach(() => {
  hideLoadingBar();
});

router.onError(() => {
  hideLoadingBar();
});
```

### 组件级加载

使用 `loadRouteLocation` 预加载路由：

```tsx
import { loadRouteLocation } from 'essor-router';

function PreloadLink({ to, children }) {
  const router = useRouter();
  
  const preload = () => {
    const route = router.resolve(to);
    loadRouteLocation(route);
  };
  
  return (
    <RouterLink to={to} onMouseEnter={preload}>
      {children}
    </RouterLink>
  );
}
```

## 错误处理

处理代码块加载失败：

```tsx
router.onError((error, to, from) => {
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    // 代码块加载失败，可能是由于新部署
    window.location.href = to.fullPath;
  }
});
```

### 重试逻辑

```tsx
function lazyWithRetry(importFn, retries = 3) {
  return () => {
    return new Promise((resolve, reject) => {
      const attempt = (retriesLeft) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft > 0) {
              setTimeout(() => attempt(retriesLeft - 1), 1000);
            } else {
              reject(error);
            }
          });
      };
      attempt(retries);
    });
  };
}

const routes = [
  {
    path: '/dashboard',
    component: lazyWithRetry(() => import('./pages/Dashboard')),
  },
];
```

## 预取

### 悬停时预取

```tsx
function PrefetchLink({ to, children }) {
  const router = useRouter();
  let prefetched = false;
  
  const prefetch = async () => {
    if (prefetched) return;
    prefetched = true;
    
    const route = router.resolve(to);
    try {
      await loadRouteLocation(route);
    } catch (e) {
      // 忽略预取错误
    }
  };
  
  return (
    <RouterLink to={to} onMouseEnter={prefetch}>
      {children}
    </RouterLink>
  );
}
```

## 懒加载嵌套路由

```tsx
const routes = [
  {
    path: '/admin',
    component: () => import('./layouts/AdminLayout'),
    children: [
      {
        path: '',
        component: () => import('./pages/admin/Dashboard'),
      },
      {
        path: 'users',
        component: () => import('./pages/admin/Users'),
      },
      {
        path: 'settings',
        component: () => import('./pages/admin/Settings'),
      },
    ],
  },
];
```

## 最佳实践

### 1. 懒加载路由级组件

```tsx
// ✅ 好 - 懒加载页面
const routes = [
  { path: '/about', component: () => import('./pages/About') },
];

// ❌ 避免 - 懒加载小型共享组件
function About() {
  const Button = () => import('./components/Button'); // 不要这样做
}
```

### 2. 分组相关路由

```tsx
// 将管理路由分组在一起
const adminRoutes = [
  { path: '/admin', component: () => import('./pages/admin/Index') },
  { path: '/admin/users', component: () => import('./pages/admin/Users') },
  { path: '/admin/settings', component: () => import('./pages/admin/Settings') },
];
```

### 3. 预加载关键路由

```tsx
// 登录后预加载仪表板
async function handleLogin() {
  await login();
  
  // 重定向时开始加载仪表板
  const dashboardRoute = router.resolve('/dashboard');
  loadRouteLocation(dashboardRoute);
  
  router.push('/dashboard');
}
```

### 4. 考虑初始包大小

将频繁访问的路由保留在主包中：

```tsx
import Home from './pages/Home'; // 在主包中
import About from './pages/About'; // 在主包中

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  { path: '/dashboard', component: () => import('./pages/Dashboard') }, // 懒加载
  { path: '/settings', component: () => import('./pages/Settings') }, // 懒加载
];
```
