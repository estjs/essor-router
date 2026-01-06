# 命名视图

命名视图允许你同时显示多个视图（RouterView），每个视图渲染不同的组件。

## 基本用法

你可以有多个命名的出口，而不是只有一个：

```tsx
function Layout() {
  return (
    <div class="container">
      <RouterView name="header" />
      <div class="main">
        <RouterView name="sidebar" />
        <RouterView /> {/* 默认视图 */}
      </div>
      <RouterView name="footer" />
    </div>
  );
}
```

## 为命名视图定义组件

使用 `components`（复数）而不是 `component`：

```tsx
const routes = [
  {
    path: '/',
    components: {
      default: MainContent,
      header: Header,
      sidebar: Sidebar,
      footer: Footer,
    },
  },
];
```

## 实际示例：仪表板布局

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
  {
    path: '/dashboard/analytics',
    components: {
      default: AnalyticsMain,
      sidebar: AnalyticsSidebar,
      header: DashboardHeader, // 复用 header
    },
  },
  {
    path: '/dashboard/settings',
    components: {
      default: SettingsMain,
      sidebar: SettingsSidebar,
      header: DashboardHeader,
    },
  },
];

// 布局组件
function DashboardLayout() {
  return (
    <div class="dashboard">
      <header class="dashboard-header">
        <RouterView name="header" />
      </header>
      
      <div class="dashboard-body">
        <aside class="dashboard-sidebar">
          <RouterView name="sidebar" />
        </aside>
        
        <main class="dashboard-main">
          <RouterView />
        </main>
      </div>
    </div>
  );
}
```

## 嵌套命名视图

将命名视图与嵌套路由结合：

```tsx
const routes = [
  {
    path: '/admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        components: {
          default: AdminDashboard,
          sidebar: AdminNav,
        },
      },
      {
        path: 'users',
        components: {
          default: UserManagement,
          sidebar: UserFilters,
        },
      },
      {
        path: 'settings',
        components: {
          default: AdminSettings,
          sidebar: SettingsNav,
        },
      },
    ],
  },
];

function AdminLayout() {
  return (
    <div class="admin-layout">
      <RouterView name="sidebar" />
      <RouterView />
    </div>
  );
}
```

## 条件命名视图

你可以有条件地显示命名视图：

```tsx
const routes = [
  {
    path: '/page',
    components: {
      default: PageContent,
      sidebar: PageSidebar, // 只在此路由显示
    },
  },
  {
    path: '/fullwidth',
    components: {
      default: FullWidthContent,
      // 没有 sidebar 组件 - sidebar 不会渲染
    },
  },
];

function Layout() {
  return (
    <div class="layout">
      <RouterView name="sidebar" /> {/* 如果没有 sidebar 组件则不渲染 */}
      <RouterView />
    </div>
  );
}
```

## 命名视图传递 Props

为命名视图组件传递 props：

```tsx
const routes = [
  {
    path: '/user/:id',
    components: {
      default: UserProfile,
      sidebar: UserSidebar,
    },
    props: {
      default: true, // 将路由参数作为 props 传递
      sidebar: (route) => ({ userId: route.params.id }),
    },
  },
];
```

## 实际示例：邮件客户端

```tsx
const routes = [
  {
    path: '/mail',
    components: {
      default: MailList,
      sidebar: FolderList,
      header: MailHeader,
    },
  },
  {
    path: '/mail/:id',
    components: {
      default: MailDetail,
      sidebar: FolderList,
      header: MailHeader,
    },
  },
  {
    path: '/mail/compose',
    components: {
      default: ComposeEmail,
      sidebar: FolderList,
      header: ComposeHeader,
    },
  },
];

function EmailApp() {
  return (
    <div class="email-app">
      <RouterView name="header" />
      
      <div class="email-body">
        <RouterView name="sidebar" />
        <RouterView />
      </div>
    </div>
  );
}
```

## 提示

### 默认视图名称

默认视图名称是 `'default'`。以下两种写法等效：

```tsx
<RouterView />
<RouterView name="default" />
```

### 缺失组件

如果命名视图在路由中没有对应的组件，它将不渲染任何内容。

### 样式命名视图

使用 CSS 布局你的命名视图：

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }
```
