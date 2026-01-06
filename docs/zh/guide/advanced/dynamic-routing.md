# 动态路由

动态路由允许你在运行时添加或删除路由，实现基于权限的菜单和插件系统等功能。

## 添加路由

### addRoute()

向路由器添加新路由：

```tsx
const router = useRouter();

// 添加顶级路由
router.addRoute({
  path: '/new-page',
  name: 'new-page',
  component: NewPage,
});
```

### 添加子路由

将路由作为现有路由的子路由添加：

```tsx
// 添加子路由到命名的父路由
router.addRoute('parent-route-name', {
  path: 'child',
  name: 'child-route',
  component: ChildComponent,
});
```

### 返回值

`addRoute()` 返回一个用于删除添加的路由的函数：

```tsx
const removeRoute = router.addRoute({
  path: '/temporary',
  component: TempPage,
});

// 稍后删除路由
removeRoute();
```

## 删除路由

### 按名称删除

```tsx
router.removeRoute('route-name');
```

### 使用删除函数

```tsx
const remove = router.addRoute({ path: '/temp', component: Temp });
remove(); // 删除路由
```

### 通过添加冲突路由删除

添加同名路由会替换现有路由：

```tsx
router.addRoute({ path: '/about', name: 'about', component: About });
router.addRoute({ path: '/about-new', name: 'about', component: AboutNew });
// 第一个路由被替换
```

## 检查路由

### hasRoute()

检查路由是否存在：

```tsx
if (router.hasRoute('admin')) {
  console.log('管理路由存在');
}
```

### getRoutes()

获取所有注册的路由：

```tsx
const routes = router.getRoutes();
routes.forEach(route => {
  console.log(route.path, route.name);
});
```

## 实际示例

### 基于权限的路由

```tsx
async function setupRoutes() {
  const permissions = await fetchUserPermissions();
  
  if (permissions.includes('admin')) {
    router.addRoute({
      path: '/admin',
      name: 'admin',
      component: () => import('./pages/Admin'),
      children: [
        { path: 'users', component: () => import('./pages/AdminUsers') },
        { path: 'settings', component: () => import('./pages/AdminSettings') },
      ],
    });
  }
  
  if (permissions.includes('analytics')) {
    router.addRoute({
      path: '/analytics',
      name: 'analytics',
      component: () => import('./pages/Analytics'),
    });
  }
}

// 登录后调用
async function handleLogin() {
  await login();
  await setupRoutes();
  router.push('/dashboard');
}
```

### 插件系统

```tsx
// 插件接口
interface RouterPlugin {
  name: string;
  routes: RouteRecordRaw[];
  install: (router: Router) => void;
}

// 注册插件
function registerPlugin(plugin: RouterPlugin) {
  plugin.routes.forEach(route => {
    router.addRoute(route);
  });
  plugin.install(router);
}

// 示例插件
const analyticsPlugin: RouterPlugin = {
  name: 'analytics',
  routes: [
    { path: '/analytics', component: AnalyticsDashboard },
    { path: '/analytics/reports', component: Reports },
  ],
  install(router) {
    router.beforeEach((to) => {
      if (to.path.startsWith('/analytics')) {
        trackPageView(to.path);
      }
    });
  },
};

registerPlugin(analyticsPlugin);
```

### 功能开关

```tsx
async function setupFeatureRoutes() {
  const features = await fetchFeatureFlags();
  
  if (features.newDashboard) {
    // 用新仪表板替换旧的
    router.addRoute({
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('./pages/NewDashboard'),
    });
  }
  
  if (features.betaFeatures) {
    router.addRoute({
      path: '/beta',
      name: 'beta',
      component: () => import('./pages/BetaFeatures'),
    });
  }
}
```

### 动态菜单生成

```tsx
function generateMenu() {
  const routes = router.getRoutes();
  
  return routes
    .filter(route => route.meta?.showInMenu)
    .map(route => ({
      path: route.path,
      name: route.meta.menuTitle || route.name,
      icon: route.meta.menuIcon,
    }));
}

function SideMenu() {
  const menuItems = generateMenu();
  
  return (
    <nav>
      {menuItems.map(item => (
        <RouterLink to={item.path} key={item.path}>
          <Icon name={item.icon} />
          {item.name}
        </RouterLink>
      ))}
    </nav>
  );
}
```

## 添加路由后导航

添加路由并立即导航时：

```tsx
router.addRoute({ path: '/new', component: NewPage });

// 路由可能还没准备好
// 使用 router.replace 确保导航正常
router.replace(router.currentRoute.value.fullPath);

// 或导航到新路由
router.push('/new');
```

## 登出时删除路由

```tsx
function handleLogout() {
  // 删除受保护的路由
  router.removeRoute('admin');
  router.removeRoute('dashboard');
  router.removeRoute('settings');
  
  // 清除认证状态
  clearAuthToken();
  
  // 重定向到登录
  router.push('/login');
}
```

## 最佳实践

### 1. 尽早添加路由

尽可能早地添加动态路由，最好在初始导航之前：

```tsx
async function initApp() {
  // 获取用户和权限
  const user = await fetchCurrentUser();
  
  // 根据权限添加路由
  await setupRoutes(user.permissions);
  
  // 现在挂载应用
  createApp(App, '#app');
}
```

### 2. 处理缺失路由

```tsx
router.beforeEach((to, from, next) => {
  // 检查路由是否存在
  if (!router.hasRoute(to.name)) {
    next('/404');
  } else {
    next();
  }
});
```

### 3. 用户切换时清理

```tsx
async function switchUser(newUserId: string) {
  // 删除当前用户的路由
  currentUserRoutes.forEach(name => router.removeRoute(name));
  
  // 添加新用户的路由
  const permissions = await fetchPermissions(newUserId);
  currentUserRoutes = await setupRoutes(permissions);
}
```
