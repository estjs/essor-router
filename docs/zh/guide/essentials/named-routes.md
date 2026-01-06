# 命名路由

命名路由允许你通过名称而不是路径来引用路由，使导航更易维护。

## 定义命名路由

为路由添加 `name` 属性：

```tsx
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/user/:id',
    name: 'user',
    component: User,
  },
  {
    path: '/user/:id/profile',
    name: 'user-profile',
    component: UserProfile,
  },
];
```

## 通过名称导航

### 使用 RouterLink

```tsx
<RouterLink to={{ name: 'home' }}>首页</RouterLink>

<RouterLink to={{ name: 'user', params: { id: '123' } }}>
  用户 123
</RouterLink>

<RouterLink to={{ name: 'user-profile', params: { id: '123' }, query: { tab: 'bio' } }}>
  用户资料
</RouterLink>
```

### 编程式导航

```tsx
const router = useRouter();

// 导航到命名路由
router.push({ name: 'home' });

// 带参数
router.push({ name: 'user', params: { id: '123' } });

// 带查询和哈希
router.push({
  name: 'user-profile',
  params: { id: '123' },
  query: { tab: 'bio' },
  hash: '#section',
});
```

## 命名路由的优势

### 1. 重构安全

如果你更改了路由的路径，所有使用名称的导航仍然有效：

```tsx
// 之前
{ path: '/user/:id', name: 'user', component: User }

// 之后 - 导航代码不需要更改
{ path: '/profile/:id', name: 'user', component: User }
```

### 2. 类型安全

命名路由与 TypeScript 配合更好，可以捕获错误：

```tsx
// TypeScript 可以帮助捕获路由名称中的拼写错误
router.push({ name: 'usr' }); // 如果 'usr' 不存在会报错
```

### 3. 更清晰的代码

命名路由比路径字符串更易读：

```tsx
// 基于路径（难以理解）
router.push(`/user/${userId}/posts/${postId}/comments`);

// 命名路由（意图更清晰）
router.push({
  name: 'post-comments',
  params: { userId, postId },
});
```

## 命名约定

为路由使用一致的命名约定：

```tsx
const routes = [
  // 使用 kebab-case
  { path: '/', name: 'home', component: Home },
  { path: '/about', name: 'about', component: About },
  
  // 嵌套路由使用父名称作为前缀
  { path: '/user/:id', name: 'user', component: User },
  { path: '/user/:id/profile', name: 'user-profile', component: UserProfile },
  { path: '/user/:id/settings', name: 'user-settings', component: UserSettings },
  
  // 操作使用描述性名称
  { path: '/user/new', name: 'user-create', component: UserCreate },
  { path: '/user/:id/edit', name: 'user-edit', component: UserEdit },
];
```

## 检查当前路由名称

```tsx
import { useRoute } from 'essor-router';

function Navigation() {
  const route = useRoute();
  
  return (
    <nav>
      <RouterLink 
        to={{ name: 'home' }}
        class={route.name === 'home' ? 'active' : ''}
      >
        首页
      </RouterLink>
    </nav>
  );
}
```

## 路由名称唯一性

路由名称在整个应用中必须唯一：

```tsx
// ❌ 错误 - 名称重复
const routes = [
  { path: '/admin/users', name: 'users', component: AdminUsers },
  { path: '/public/users', name: 'users', component: PublicUsers }, // 冲突！
];

// ✅ 正确 - 名称唯一
const routes = [
  { path: '/admin/users', name: 'admin-users', component: AdminUsers },
  { path: '/public/users', name: 'public-users', component: PublicUsers },
];
```

## 解析命名路由

使用 `router.resolve()` 获取命名路由的 URL：

```tsx
const router = useRouter();

const resolved = router.resolve({ name: 'user', params: { id: '123' } });
console.log(resolved.href); // '/user/123'
console.log(resolved.fullPath); // '/user/123'
```

这对于生成 URL 而不导航很有用：

```tsx
function ShareButton({ userId }) {
  const router = useRouter();
  
  const shareUrl = router.resolve({
    name: 'user-profile',
    params: { id: userId },
  }).href;
  
  const share = () => {
    navigator.clipboard.writeText(window.location.origin + shareUrl);
  };
  
  return <button onClick={share}>复制资料链接</button>;
}
```
