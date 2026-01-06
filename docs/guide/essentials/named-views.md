# Named Views

Named views allow you to display multiple views (RouterView) at the same time, each rendering a different component.

## Basic Usage

Instead of having one outlet, you can have multiple named outlets:

```tsx
function Layout() {
  return (
    <div class="container">
      <RouterView name="header" />
      <div class="main">
        <RouterView name="sidebar" />
        <RouterView /> {/* default view */}
      </div>
      <RouterView name="footer" />
    </div>
  );
}
```

## Defining Components for Named Views

Use `components` (plural) instead of `component`:

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

## Practical Example: Dashboard Layout

```tsx
// Route configuration
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
      header: DashboardHeader, // Reuse header
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

// Layout component
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

## Nested Named Views

Combine named views with nested routes:

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

## Conditional Named Views

You can conditionally show named views:

```tsx
const routes = [
  {
    path: '/page',
    components: {
      default: PageContent,
      sidebar: PageSidebar, // Only shown on this route
    },
  },
  {
    path: '/fullwidth',
    components: {
      default: FullWidthContent,
      // No sidebar component - sidebar won't render
    },
  },
];

function Layout() {
  return (
    <div class="layout">
      <RouterView name="sidebar" /> {/* Renders nothing if no sidebar component */}
      <RouterView />
    </div>
  );
}
```

## Named Views with Props

Pass props to named view components:

```tsx
const routes = [
  {
    path: '/user/:id',
    components: {
      default: UserProfile,
      sidebar: UserSidebar,
    },
    props: {
      default: true, // Pass route params as props
      sidebar: (route) => ({ userId: route.params.id }),
    },
  },
];
```

## Real-World Example: Email Client

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

## Tips

### Default View Name

The default view name is `'default'`. These are equivalent:

```tsx
<RouterView />
<RouterView name="default" />
```

### Missing Components

If a named view doesn't have a corresponding component in the route, it simply renders nothing.

### Styling Named Views

Use CSS to layout your named views:

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
