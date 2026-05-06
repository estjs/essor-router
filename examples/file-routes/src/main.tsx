import { createApp } from 'essor';
import { RouterLink, RouterView, createRouter, createWebHistory } from 'essor-router';
import { routes } from 'essor-router/auto-routes';

const router = createRouter({
  history: createWebHistory(),
  routes,
});
const App = () => {
  return (
    <div>
      <header>
        <nav style="display: flex; gap: 10px; padding: 10px; background: #eee;">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/users/123">User 123</RouterLink>
          <RouterLink to="/post/abc">Post ABC</RouterLink>
          <RouterLink to="/nested/child">Nested Child</RouterLink>
          <RouterLink to="/dashboard">Dashboard</RouterLink>
          <RouterLink to="/unknown">Not Found</RouterLink>
        </nav>
      </header>
      <div style="display: flex; gap: 24px; padding: 20px;">
        <main style="flex: 1;">
          <RouterView router={router} />
        </main>
        <aside style="width: 240px; border-left: 1px solid #ddd; padding-left: 16px;">
          <RouterView router={router} name="sidebar">
            <div data-testid="sidebar-empty">No Sidebar Content</div>
          </RouterView>
        </aside>
      </div>
    </div>
  );
};

createApp(App, '#app');
