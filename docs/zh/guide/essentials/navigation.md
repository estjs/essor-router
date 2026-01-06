# 编程式导航

除了使用 `<RouterLink>` 进行声明式导航外，你还可以使用路由器实例进行编程式导航。

## 获取路由器实例

使用 `useRouter` hook 访问路由器：

```tsx
import { useRouter } from 'essor-router';

function MyComponent() {
  const router = useRouter();
  
  // 现在可以使用 router.push()、router.replace() 等
}
```

## router.push()

导航到新 URL 并向历史栈添加一条记录：

```tsx
// 字符串路径
router.push('/users');

// 带路径的对象
router.push({ path: '/users' });

// 命名路由带参数
router.push({ name: 'user', params: { id: '123' } });

// 带查询参数
router.push({ path: '/search', query: { q: 'essor' } });

// 带哈希
router.push({ path: '/about', hash: '#team' });

// 完整示例
router.push({
  name: 'user',
  params: { id: '123' },
  query: { tab: 'profile' },
  hash: '#bio',
});
```

## router.replace()

导航但不添加历史记录（替换当前记录）：

```tsx
// 字符串路径
router.replace('/users');

// 带路径的对象
router.replace({ path: '/users' });

// 或使用 push 的 replace 选项
router.push({ path: '/users', replace: true });
```

当你不希望用户能够导航回上一页时使用 `replace`。

## router.go()

通过相对位置在历史记录中导航：

```tsx
// 前进一条记录
router.go(1);

// 后退一条记录
router.go(-1);

// 后退两条记录
router.go(-2);
```

## router.back() 和 router.forward()

常用导航的便捷方法：

```tsx
// 等同于 router.go(-1)
router.back();

// 等同于 router.go(1)
router.forward();
```

## 处理导航结果

`router.push()` 和 `router.replace()` 返回 Promise：

```tsx
async function navigate() {
  try {
    await router.push('/users');
    console.log('导航成功');
  } catch (error) {
    console.error('导航失败：', error);
  }
}
```

### 导航失败

```tsx
import { isNavigationFailure, NavigationFailureType } from 'essor-router';

const result = await router.push('/users');

if (isNavigationFailure(result)) {
  // 导航被阻止
  console.log('导航失败');
}

if (isNavigationFailure(result, NavigationFailureType.aborted)) {
  // 导航被守卫中止
  console.log('导航被中止');
}

if (isNavigationFailure(result, NavigationFailureType.duplicated)) {
  // 已经在目标位置
  console.log('已在当前位置');
}
```

## 实际示例

### 表单提交后导航

```tsx
function LoginForm() {
  const router = useRouter();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const success = await login(credentials);
    
    if (success) {
      // 登录后重定向到仪表板
      router.push('/dashboard');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 带确认的导航

```tsx
function Editor() {
  const router = useRouter();
  
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('放弃更改？')) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  };
  
  return <button onClick={handleClose}>关闭</button>;
}
```

### 基于条件的重定向

```tsx
function ProtectedPage() {
  const router = useRouter();
  const route = useRoute();
  
  if (!isAuthenticated()) {
    // 重定向到登录页并带上返回 URL
    router.replace({
      path: '/login',
      query: { redirect: route.fullPath },
    });
    return null;
  }
  
  return <div>受保护的内容</div>;
}
```

### 带回退的返回按钮

```tsx
function BackButton() {
  const router = useRouter();
  
  const goBack = () => {
    // 检查是否有历史记录可以返回
    if (window.history.length > 1) {
      router.back();
    } else {
      // 回退到首页
      router.push('/');
    }
  };
  
  return <button onClick={goBack}>返回</button>;
}
```
