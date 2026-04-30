import { createApp } from 'essor';
import { RouterView, createRouter, createWebHistory } from 'essor-router';
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
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/users/123">User 123</a>
          <a href="/post/abc">Post ABC</a>
          <a href="/nested/child">Nested Child</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/unknown">Not Found</a>
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
