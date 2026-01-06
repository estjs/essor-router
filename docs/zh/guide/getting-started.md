# 快速开始

本指南将引导你使用 essor-router 创建一个基本应用。

## 基本设置

### 1. 创建组件

首先，创建一些简单的页面组件：

```tsx
// Home.tsx
function Home() {
  return <div>欢迎来到首页</div>;
}

// About.tsx
function About() {
  return <div>关于我们</div>;
}

// NotFound.tsx
function NotFound() {
  return <div>404 - 页面未找到</div>;
}
```

### 2. 创建路由器

使用你的路由创建路由器实例：

```tsx
// router.ts
import { createRouter } from 'essor-router';
import Home from './Home';
import About from './About';
import NotFound from './NotFound';

export const router = createRouter({
  history: 'history', // 使用 HTML5 History 模式
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/about',
      component: About,
    },
    {
      path: '/:pathMatch(.*)*',
      component: NotFound,
    },
  ],
});
```

### 3. 使用 RouterView 创建应用

使用 `RouterView` 渲染匹配的组件：

```tsx
// App.tsx
import { RouterView, RouterLink } from 'essor-router';
import { router } from './router';

function App() {
  return (
    <div>
      <nav>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
      
      <main>
        <RouterView router={router} />
      </main>
    </div>
  );
}

export default App;
```

### 4. 挂载应用

```tsx
// main.tsx
import { createApp } from 'essor';
import App from './App';

createApp(App, '#app');
```

## 完整示例

这是一个完整的单文件示例：

```tsx
import { createApp } from 'essor';
import { createRouter, RouterView, RouterLink } from 'essor-router';

// 组件
function Home() {
  return (
    <div>
      <h1>首页</h1>
      <p>欢迎使用 essor-router！</p>
    </div>
  );
}

function About() {
  return (
    <div>
      <h1>关于</h1>
      <p>这是关于页面。</p>
    </div>
  );
}

function User() {
  return (
    <div>
      <h1>用户资料</h1>
    </div>
  );
}

// 路由器
const router = createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    { path: '/user/:id', component: User },
  ],
});

// 应用
function App() {
  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
        <RouterLink to="/user/123">用户 123</RouterLink>
      </nav>
      
      <main style={{ padding: '1rem' }}>
        <RouterView router={router} />
      </main>
    </div>
  );
}

createApp(App, '#app');
```

## 使用组合式 API

在组件中访问路由信息：

```tsx
import { useRouter, useRoute } from 'essor-router';

function User() {
  const router = useRouter();
  const route = useRoute();
  
  const goHome = () => {
    router.push('/');
  };
  
  return (
    <div>
      <h1>用户资料</h1>
      <p>用户 ID：{route.params.id}</p>
      <button onClick={goHome}>返回首页</button>
    </div>
  );
}
```

## 历史模式

essor-router 支持三种历史模式：

### HTML5 History 模式（推荐）

```tsx
const router = createRouter({
  history: 'history',
  routes: [...],
});
```

干净的 URL，如 `/user/123`。需要服务器配置来处理客户端路由。

### Hash 模式

```tsx
const router = createRouter({
  history: 'hash',
  routes: [...],
});
```

带哈希的 URL，如 `/#/user/123`。无需服务器配置。

### Memory 模式

```tsx
const router = createRouter({
  history: 'memory',
  routes: [...],
});
```

不改变 URL。适用于 SSR 和测试。

## 下一步

- 了解[路由配置](/zh/guide/essentials/route-configuration)
- 探索[动态路由匹配](/zh/guide/essentials/dynamic-matching)
- 设置[导航守卫](/zh/guide/advanced/navigation-guards)
