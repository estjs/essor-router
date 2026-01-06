# 导航守卫

导航守卫允许你通过重定向、取消或修改导航来控制导航流程。

## 全局守卫

### beforeEach

在每次导航前调用。用于认证、日志记录等。

```tsx
router.beforeEach((to, from, next) => {
  // 检查认证
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
});
```

### beforeResolve

在组件内守卫和异步路由组件解析后调用。

```tsx
router.beforeResolve((to, from, next) => {
  // 所有组件已加载
  next();
});
```

### afterEach

在导航确认后调用。不能影响导航。

```tsx
router.afterEach((to, from, failure) => {
  // 记录页面访问
  analytics.trackPageView(to.fullPath);
  
  // 更新文档标题
  document.title = to.meta.title || '我的应用';
  
  // 检查导航失败
  if (failure) {
    console.error('导航失败：', failure);
  }
});
```

## 路由独享守卫

### beforeEnter

直接在路由配置中定义：

```tsx
const routes = [
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
  },
];
```

### 多个守卫

你可以传递守卫数组：

```tsx
const routes = [
  {
    path: '/admin',
    component: Admin,
    beforeEnter: [checkAuth, checkAdmin, logAccess],
  },
];

function checkAuth(to, from, next) {
  if (!isAuthenticated()) {
    next('/login');
  } else {
    next();
  }
}

function checkAdmin(to, from, next) {
  if (!isAdmin()) {
    next('/forbidden');
  } else {
    next();
  }
}

function logAccess(to, from, next) {
  console.log(`管理员访问：${to.path}`);
  next();
}
```

## 组件内守卫

### onBeforeRouteLeave

当组件即将被导航离开时调用：

```tsx
import { onBeforeRouteLeave } from 'essor-router';

function Editor() {
  const hasChanges = signal(false);
  
  onBeforeRouteLeave((to, from, next) => {
    if (hasChanges.value) {
      const answer = confirm('你有未保存的更改。确定离开吗？');
      if (answer) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });
  
  return <div>编辑器</div>;
}
```

### onBeforeRouteUpdate

当路由改变但组件被复用时调用：

```tsx
import { onBeforeRouteUpdate } from 'essor-router';

function User() {
  const route = useRoute();
  const userData = signal(null);
  
  onBeforeRouteUpdate(async (to, from, next) => {
    // 当 ID 改变时获取新用户数据
    if (to.params.id !== from.params.id) {
      userData.value = await fetchUser(to.params.id);
    }
    next();
  });
  
  return <div>用户：{userData.value?.name}</div>;
}
```

## 守卫参数

### to

目标路由位置：

```tsx
router.beforeEach((to, from, next) => {
  console.log(to.path);       // '/user/123'
  console.log(to.params);     // { id: '123' }
  console.log(to.query);      // { tab: 'profile' }
  console.log(to.hash);       // '#bio'
  console.log(to.fullPath);   // '/user/123?tab=profile#bio'
  console.log(to.name);       // 'user'
  console.log(to.meta);       // { requiresAuth: true }
  console.log(to.matched);    // 匹配的路由记录数组
  next();
});
```

### from

当前路由位置（与 `to` 结构相同）。

### next

解析守卫的函数：

```tsx
// 继续导航
next();

// 取消导航
next(false);

// 重定向到不同位置
next('/login');
next({ path: '/login' });
next({ name: 'login', query: { redirect: to.fullPath } });

// 中止并抛出错误
next(new Error('导航失败'));
```

## 实际示例

### 认证守卫

```tsx
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isLoggedIn = !!localStorage.getItem('token');
  
  if (requiresAuth && !isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  } else {
    next();
  }
});
```

### 基于角色的访问控制

```tsx
router.beforeEach((to, from, next) => {
  const requiredRoles = to.meta.roles;
  
  if (requiredRoles) {
    const userRoles = getUserRoles();
    const hasAccess = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasAccess) {
      next('/forbidden');
      return;
    }
  }
  
  next();
});
```

### 加载指示器

```tsx
router.beforeEach((to, from, next) => {
  showLoadingIndicator();
  next();
});

router.afterEach(() => {
  hideLoadingIndicator();
});
```

### 页面标题

```tsx
router.afterEach((to) => {
  const title = to.meta.title;
  document.title = title ? `${title} - 我的应用` : '我的应用';
});
```
