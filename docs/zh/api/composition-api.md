# 组合式 API

essor-router 提供组合式函数用于在组件中访问路由器功能。

## useRouter

返回路由器实例。

### 签名

```tsx
function useRouter(): Router
```

### 用法

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

### 返回值

`Router` 实例及其所有方法和属性：

- `currentRoute` - 当前路由（Signal）
- `options` - 路由器选项
- `push()` - 导航到位置
- `replace()` - 替换当前位置
- `back()` - 后退
- `forward()` - 前进
- `go()` - 跳转到历史位置
- `beforeEach()` - 添加前置守卫
- `afterEach()` - 添加后置钩子
- `addRoute()` - 添加路由
- `removeRoute()` - 删除路由
- `hasRoute()` - 检查路由是否存在
- `getRoutes()` - 获取所有路由
- `resolve()` - 解析路由位置

---

## useRoute

返回当前路由位置。

### 签名

```tsx
function useRoute(): RouteLocationNormalizedLoaded
```

### 用法

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

### 返回值

当前路由位置对象：

| 属性 | 类型 | 描述 |
|------|------|------|
| `path` | `string` | URL 路径 |
| `fullPath` | `string` | 包含查询和哈希的完整 URL |
| `name` | `string \| undefined` | 路由名称 |
| `params` | `Record<string, string>` | 路由参数 |
| `query` | `Record<string, string>` | 查询参数 |
| `hash` | `string` | URL 哈希 |
| `meta` | `RouteMeta` | 路由元信息 |
| `matched` | `RouteRecordNormalized[]` | 匹配的路由记录 |
| `redirectedFrom` | `RouteLocation \| undefined` | 如果重定向，原始路由 |
| `href` | `string` | 解析的 href |

---

## onBeforeRouteLeave

注册离开当前路由时的导航守卫。

### 签名

```tsx
function onBeforeRouteLeave(guard: NavigationGuard): void
```

### 用法

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
  
  return <div>编辑器</div>;
}
```

### 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `guard` | `NavigationGuard` | 守卫函数 |

### 守卫函数

```tsx
type NavigationGuard = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => void | Promise<void>
```

### next() 选项

```tsx
next();           // 继续
next(false);      // 取消导航
next('/path');    // 重定向到路径
next({ name: 'route' }); // 重定向到命名路由
next(new Error('message')); // 中止并抛出错误
```

---

## onBeforeRouteUpdate

注册路由变化但组件被复用时的导航守卫。

### 签名

```tsx
function onBeforeRouteUpdate(guard: NavigationGuard): void
```

### 用法

```tsx
import { onBeforeRouteUpdate, useRoute } from 'essor-router';

function UserProfile() {
  const route = useRoute();
  const user = signal(null);
  
  // 初始加载
  fetchUser(route.params.id).then(data => {
    user.value = data;
  });
  
  // 响应参数变化
  onBeforeRouteUpdate(async (to, from, next) => {
    if (to.params.id !== from.params.id) {
      user.value = await fetchUser(to.params.id);
    }
    next();
  });
  
  return <div>用户：{user.value?.name}</div>;
}
```

### 何时调用

此守卫在以下情况调用：
- 路由路径变化但匹配相同组件
- 路由参数变化（例如 `/user/1` 到 `/user/2`）
- 查询或哈希变化

---

## loadRouteLocation

确保路由的异步组件已加载。

### 签名

```tsx
function loadRouteLocation(
  route: RouteLocationNormalized
): Promise<RouteLocationNormalizedLoaded>
```

### 用法

```tsx
import { loadRouteLocation } from 'essor-router';

function PreloadLink({ to, children }) {
  const router = useRouter();
  
  const preload = async () => {
    const route = router.resolve(to);
    await loadRouteLocation(route);
  };
  
  return (
    <RouterLink to={to} onMouseEnter={preload}>
      {children}
    </RouterLink>
  );
}
```

---

## 示例：完整组件

```tsx
import { 
  onBeforeRouteLeave, 
  onBeforeRouteUpdate, 
  useRoute, 
  useRouter 
} from 'essor-router';

function UserEditor() {
  const router = useRouter();
  const route = useRoute();
  
  const userId = route.params.id;
  const user = signal(null);
  const isDirty = signal(false);
  
  // 加载用户数据
  async function loadUser(id) {
    user.value = await fetchUser(id);
    isDirty.value = false;
  }
  
  // 初始加载
  loadUser(userId);
  
  // 处理路由参数变化
  onBeforeRouteUpdate(async (to, from, next) => {
    if (to.params.id !== from.params.id) {
      if (isDirty.value) {
        const confirmed = confirm('放弃更改并切换用户？');
        if (!confirmed) {
          next(false);
          return;
        }
      }
      await loadUser(to.params.id);
    }
    next();
  });
  
  // 离开前确认
  onBeforeRouteLeave((to, from, next) => {
    if (isDirty.value) {
      const confirmed = confirm('你有未保存的更改。确定离开吗？');
      if (!confirmed) {
        next(false);
        return;
      }
    }
    next();
  });
  
  // 保存并导航
  async function saveAndClose() {
    await saveUser(user.value);
    isDirty.value = false;
    router.push('/users');
  }
  
  return (
    <div>
      <h1>编辑用户 {userId}</h1>
      <input 
        value={user.value?.name || ''} 
        onChange={(e) => {
          user.value = { ...user.value, name: e.target.value };
          isDirty.value = true;
        }}
      />
      <button onClick={saveAndClose}>保存并关闭</button>
      <button onClick={() => router.back()}>取消</button>
    </div>
  );
}
```
