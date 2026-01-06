# Nested Routes

Nested routes allow you to create complex layouts with multiple levels of `RouterView` components.

## Basic Nested Routes

Define child routes using the `children` property:

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

The parent component must include a `<RouterView>` to render child routes:

```tsx
function User() {
  const route = useRoute();
  
  return (
    <div>
      <h1>User {route.params.id}</h1>
      <nav>
        <RouterLink to="">Home</RouterLink>
        <RouterLink to="profile">Profile</RouterLink>
        <RouterLink to="posts">Posts</RouterLink>
      </nav>
      
      {/* Child routes render here */}
      <RouterView />
    </div>
  );
}
```

## URL Structure

| URL | Matched Components |
|-----|-------------------|
| `/user/123` | `User` → `UserHome` |
| `/user/123/profile` | `User` → `UserProfile` |
| `/user/123/posts` | `User` → `UserPosts` |

## Empty Path Children

A child route with an empty path (`''`) matches when the parent route is matched exactly:

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

## Deeply Nested Routes

You can nest routes to any depth:

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

## Named Routes with Nesting

Give names to nested routes for easier navigation:

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

// Navigate by name
router.push({ name: 'user-profile', params: { id: '123' } });
```

## Nested Routes with Redirect

Redirect from parent to a specific child:

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

## Absolute Nested Paths

Child routes can have absolute paths (starting with `/`):

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    children: [
      { path: '', component: UserHome },
      { path: '/profile/:id', component: UserProfile }, // Absolute path
    ],
  },
];
```

## Nested Named Views

Combine nested routes with named views:

```tsx
const routes = [
  {
    path: '/dashboard',
    component: DashboardLayout,
    children: [
      {
        path: '',
        components: {
          default: DashboardMain,
          sidebar: DashboardSidebar,
        },
      },
      {
        path: 'analytics',
        components: {
          default: AnalyticsMain,
          sidebar: AnalyticsSidebar,
        },
      },
    ],
  },
];

function DashboardLayout() {
  return (
    <div class="dashboard">
      <RouterView name="sidebar" />
      <main>
        <RouterView />
      </main>
    </div>
  );
}
```

## Passing Props to Nested Routes

```tsx
const routes = [
  {
    path: '/user/:id',
    component: User,
    props: true,
    children: [
      { path: 'profile', component: UserProfile, props: true },
      { 
        path: 'posts', 
        component: UserPosts, 
        props: (route) => ({ userId: route.params.id }) 
      },
    ],
  },
];
```

## Complete Example

```tsx
// Route configuration
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
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/users">Users</RouterLink>
        </nav>
      </header>
      <main>
        <RouterView />
      </main>
    </div>
  );
}

// UsersLayout.tsx
function UsersLayout() {
  return (
    <div class="users-layout">
      <h1>Users</h1>
      <RouterView />
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
          Overview
        </RouterLink>
        <RouterLink to={{ name: 'user-profile', params: { id: route.params.id } }}>
          Profile
        </RouterLink>
        <RouterLink to={{ name: 'user-settings', params: { id: route.params.id } }}>
          Settings
        </RouterLink>
      </nav>
      <RouterView />
    </div>
  );
}
```
