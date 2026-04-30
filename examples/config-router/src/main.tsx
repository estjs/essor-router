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
        <nav style="display: flex; gap: 10px; padding: 10px; background: #eef;">
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/users/456">User 456</a>
          <a href="/post/typed">Typed Post</a>
          <a href="/nested/child">Nested</a>
          <a href="/missing">Catch All</a>
        </nav>
      </header>
      <main style="padding: 20px;">
        <RouterView router={router} />
      </main>
    </div>
  );
};
createApp(App, '#app');
