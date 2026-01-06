# 嵌套路由

嵌套路由允许你创建具有多层 `RouterView` 组件的复杂布局。

## 基础嵌套路由

使用 `children` 属性定义子路由：

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      { path: '', component: UserHome },
      { path: 'profile', component: UserProfile },
      { path: 'posts', component: UserPosts },
    ],
  },
];
```

父组件必须包含 `<RouterView>` 来渲染子路由：

```tsx
function User() {
  const route = useRoute();
  
  return (
    <div>
      <h1>用户 {route.params.id}</h1>
      <nav>
        <RouterLink to="">首页</RouterLink>
        <RouterLink to="profile">资料</RouterLink>
        <RouterLink to="posts">文章</RouterLink>
      </nav>
      
      {/* 子路由在这里渲染 */}
      <RouterView />
    </div>
  );
}
```

## URL 结构

| URL | 匹配的组件 |
|-----|-----------|
| `/user/123` | `User` → `UserHome` |
| `/user/123/profile` | `User` → `UserProfile` |
| `/user/123/posts` | `User` → `UserPosts` |

## 空路径子路由

空路径（`''`）的子路由在父路由精确匹配时渲染：

```tsx
const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
    children: [
      { path: '', component: DashboardHome },      // /dashboard
      { path: 'settings', component: Settings },   // /dashboard/settings
    ],
  },
];
```

## 深层嵌套路由

你可以嵌套任意深度的路由：

```tsx
const routes = [
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: 'users',
        component: UsersLayout,
        children: [
          { path: '', component: UsersList },
          { path: ':id', component: UserDetail },
          { path: ':id/edit', component: UserEdit },
        ],
      },
      {
        path: 'settings',
        component: SettingsLayout,
        children: [
          { path: '', component: GeneralSettings },
          { path: 'security', component: SecuritySettings },
        ],
      },
    ],
  },
];
```

## 带命名的嵌套路由

为嵌套路由命名以便于导航：

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      { path: '', name: 'user-home', component: UserHome },
      { path: 'profile', name: 'user-profile', component: UserProfile },
      { path: 'posts', name: 'user-posts', component: UserPosts },
    ],
  },
];

// 通过名称导航
router.push({ name: 'user-profile', params: { id: '123' } });
```

## 嵌套路由重定向

从父路由重定向到特定子路由：

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    redirect: { name: 'user-profile' },
    children: [
      { path: 'profile', name: 'user-profile', component: UserProfile },
      { path: 'posts', name: 'user-posts', component: UserPosts },
    ],
  },
];
```

## 完整示例

```tsx
// 路由配置
const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', name: 'home', component: Home },
      { path: 'about', name: 'about', component: About },
      {
        path: 'users',
        component: UsersLayout,
        children: [
          { path: '', name: 'users-list', component: UsersList },
          {
            path: ':id',
            component: UserLayout,
            children: [
              { path: '', name: 'user-overview', component: UserOverview },
              { path: 'profile', name: 'user-profile', component: UserProfile },
              { path: 'settings', name: 'user-settings', component: UserSettings },
            ],
          },
        ],
      },
    ],
  },
];

// MainLayout.tsx
function MainLayout() {
  return (
    <div>
      <header>
        <nav>
          <RouterLink to="/">首页</RouterLink>
          <RouterLink to="/about">关于</RouterLink>
          <RouterLink to="/users">用户</RouterLink>
        </nav>
      </header>
      <main>
        <RouterView />
      </main>
    </div>
  );
}

// UserLayout.tsx
function UserLayout() {
  const route = useRoute();
  
  return (
    <div class="user-layout">
      <nav>
        <RouterLink to={{ name: 'user-overview', params: { id: route.params.id } }}>
          概览
        </RouterLink>
        <RouterLink to={{ name: 'user-profile', params: { id: route.params.id } }}>
          资料
        </RouterLink>
        <RouterLink to={{ name: 'user-settings', params: { id: route.params.id } }}>
          设置
        </RouterLink>
      </nav>
      <RouterView />
    </div>
  );
}
```
