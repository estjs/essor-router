# RouterView

`RouterView` 组件渲染当前路由匹配的组件。

## 基本用法

```tsx
import { RouterView } from 'essor-router';

function App() {
  return (
    <div>
      <RouterView router={router} />
    </div>
  );
}
```

## Props

### router

- **类型：** `Router`
- **必填：** 否（如果通过上下文提供）

路由器实例：

```tsx
<RouterView router={router} />
```

如果未提供，RouterView 将尝试从上下文注入路由器。

### name

- **类型：** `string`
- **默认值：** `'default'`

命名视图的名称：

```tsx
<RouterView name="sidebar" />
<RouterView name="header" />
<RouterView /> {/* 默认 */}
```

### route

- **类型：** `RouteLocationNormalized`
- **必填：** 否

覆盖要显示的路由：

```tsx
const customRoute = router.resolve('/custom-path');
<RouterView route={customRoute} />
```

### fallback

- **类型：** `Component`
- **必填：** 否

渲染失败时的回退组件：

```tsx
<RouterView fallback={ErrorFallback} />
```

### onError

- **类型：** `(error: Error) => void`
- **必填：** 否

组件渲染错误的处理器：

```tsx
<RouterView onError={(error) => console.error(error)} />
```

### children

- **类型：** `ReactNode`
- **必填：** 否

没有路由匹配时渲染的内容：

```tsx
<RouterView>
  <div>没有匹配的路由</div>
</RouterView>
```

## 命名视图

使用不同名称的多个 RouterView 组件：

```tsx
// 路由配置
const routes = [
  {
    path: '/dashboard',
    components: {
      default: DashboardMain,
      sidebar: DashboardSidebar,
      header: DashboardHeader,
    },
  },
];

// 布局
function Layout() {
  return (
    <div class="layout">
      <RouterView name="header" />
      <div class="body">
        <RouterView name="sidebar" />
        <RouterView /> {/* 默认 */}
      </div>
    </div>
  );
}
```

## 嵌套路由

RouterView 自动处理嵌套路由：

```tsx
// 路由配置
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      { path: '', component: UserHome },
      { path: 'profile', component: UserProfile },
    ],
  },
];

// 带嵌套 RouterView 的 User 组件
function User() {
  return (
    <div>
      <h1>用户</h1>
      <RouterView /> {/* 渲染 UserHome 或 UserProfile */}
    </div>
  );
}
```

## 示例

```tsx
import { RouterLink, RouterView, createRouter } from 'essor-router';

const router = createRouter({
  history: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/about', component: About },
    {
      path: '/dashboard',
      components: {
        default: DashboardMain,
        sidebar: DashboardSidebar,
      },
    },
  ],
});

function App() {
  return (
    <div>
      <nav>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
        <RouterLink to="/dashboard">仪表板</RouterLink>
      </nav>
      
      <main>
        <RouterView 
          router={router}
          onError={(error) => {
            console.error('路由组件错误：', error);
          }}
        >
          <div>加载中...</div>
        </RouterView>
      </main>
    </div>
  );
}
```
