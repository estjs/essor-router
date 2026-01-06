# 组合式 API

essor-router 提供组合式函数用于在组件中访问路由器功能。

## useRouter

返回路由器实例：

```tsx
import { useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  
  const navigate = () => {
    router.push('/about');
  };
  
  return <button onClick={navigate}>前往关于页</button>;
}
```

### 路由器实例属性

```tsx
const router = useRouter();

// 当前路由（Signal）
router.currentRoute.value;

// 路由器选项
router.options;

// 监听状态
router.listening;
```

### 路由器实例方法

```tsx
const router = useRouter();

// 导航
router.push('/path');
router.replace('/path');
router.back();
router.forward();
router.go(-2);

// 路由管理
router.addRoute({ path: '/new', component: NewPage });
router.removeRoute('route-name');
router.hasRoute('route-name');
router.getRoutes();

// 路由解析
router.resolve('/path');
router.resolve({ name: 'route-name', params: { id: '123' } });

// 守卫
router.beforeEach((to, from, next) => next());
router.beforeResolve((to, from, next) => next());
router.afterEach((to, from) => {});

// 错误处理
router.onError((error) => {});

// 就绪状态
await router.isReady();
```

## useRoute

返回当前路由位置：

```tsx
import { useRoute } from 'essor-router';

function MyComponent() {
  const route = useRoute();
  
  return (
    <div>
      <p>路径：{route.path}</p>
      <p>参数：{JSON.stringify(route.params)}</p>
      <p>查询：{JSON.stringify(route.query)}</p>
    </div>
  );
}
```

### 路由属性

```tsx
const route = useRoute();

// 基础属性
route.path;        // '/user/123'
route.fullPath;    // '/user/123?tab=profile#bio'
route.name;        // 'user'
route.hash;        // '#bio'

// 参数
route.params;      // { id: '123' }
route.query;       // { tab: 'profile' }

// 元信息
route.meta;        // { requiresAuth: true }

// 匹配的路由
route.matched;     // 匹配的路由记录数组

// 重定向信息
route.redirectedFrom;  // 如果重定向，原始路由
```

## onBeforeRouteLeave

注册离开当前路由时运行的守卫：

```tsx
import { onBeforeRouteLeave } from 'essor-router';

function Editor() {
  const hasUnsavedChanges = signal(false);
  
  onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChanges.value) {
      const confirmed = confirm('放弃未保存的更改？');
      if (confirmed) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });
  
  return <div>编辑器内容</div>;
}
```

## onBeforeRouteUpdate

注册路由变化但组件被复用时运行的守卫：

```tsx
import { onBeforeRouteUpdate, useRoute } from 'essor-router';

function UserProfile() {
  const route = useRoute();
  const user = signal(null);
  
  // 加载初始用户
  loadUser(route.params.id);
  
  // 响应路由参数变化
  onBeforeRouteUpdate(async (to, from, next) => {
    if (to.params.id !== from.params.id) {
      user.value = await fetchUser(to.params.id);
    }
    next();
  });
  
  return <div>用户：{user.value?.name}</div>;
}
```

## 实际示例

### 带确认的导航

```tsx
function useNavigationConfirm(shouldConfirm: () => boolean, message: string) {
  const router = useRouter();
  
  onBeforeRouteLeave((to, from, next) => {
    if (shouldConfirm()) {
      if (confirm(message)) {
        next();
      } else {
        next(false);
      }
    } else {
      next();
    }
  });
  
  return {
    navigate: (path: string) => {
      if (shouldConfirm()) {
        if (confirm(message)) {
          router.push(path);
        }
      } else {
        router.push(path);
      }
    },
  };
}

// 使用
function Editor() {
  const isDirty = signal(false);
  
  const { navigate } = useNavigationConfirm(
    () => isDirty.value,
    '你有未保存的更改。确定离开吗？'
  );
  
  return (
    <div>
      <button onClick={() => navigate('/')}>首页</button>
    </div>
  );
}
```

### 面包屑

```tsx
function useBreadcrumbs() {
  const route = useRoute();
  
  return route.matched
    .filter(record => record.meta?.breadcrumb)
    .map(record => ({
      name: record.meta.breadcrumb,
      path: record.path,
    }));
}

function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs();
  
  return (
    <nav>
      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.path}>
          {i > 0 && ' / '}
          <RouterLink to={crumb.path}>{crumb.name}</RouterLink>
        </span>
      ))}
    </nav>
  );
}
```

### 页面标题

```tsx
function usePageTitle(defaultTitle = '我的应用') {
  const route = useRoute();
  
  // 路由变化时更新标题
  const title = route.meta?.title;
  document.title = title ? `${title} | ${defaultTitle}` : defaultTitle;
}

function App() {
  usePageTitle('我的应用');
  
  return <RouterView />;
}
```

### 查询参数

```tsx
function useQueryParams<T extends Record<string, string>>() {
  const route = useRoute();
  const router = useRouter();
  
  const setQuery = (params: Partial<T>) => {
    router.push({
      path: route.path,
      query: { ...route.query, ...params },
    });
  };
  
  const removeQuery = (...keys: (keyof T)[]) => {
    const newQuery = { ...route.query };
    keys.forEach(key => delete newQuery[key as string]);
    router.push({ path: route.path, query: newQuery });
  };
  
  return {
    query: route.query as T,
    setQuery,
    removeQuery,
  };
}

// 使用
function SearchPage() {
  const { query, setQuery } = useQueryParams<{ q: string; page: string }>();
  
  return (
    <div>
      <input
        value={query.q || ''}
        onChange={(e) => setQuery({ q: e.target.value })}
      />
      <p>当前页：{query.page || '1'}</p>
    </div>
  );
}
```

### 路由匹配

```tsx
function useRouteMatch(pattern: string | RegExp) {
  const route = useRoute();
  
  if (typeof pattern === 'string') {
    return route.path === pattern || route.path.startsWith(pattern + '/');
  }
  
  return pattern.test(route.path);
}

// 使用
function Navigation() {
  const isAdmin = useRouteMatch('/admin');
  const isUser = useRouteMatch(/^\/user\/\d+/);
  
  return (
    <nav>
      <RouterLink to="/admin" class={isAdmin ? 'active' : ''}>
        管理
      </RouterLink>
    </nav>
  );
}
```
