import { createApp } from 'essor';
import { RouterLink, RouterView, createRouter, createWebHistory } from 'essor-router';
import { routes } from 'essor-router/auto-routes';
import { resolver } from 'essor-router/auto-resolver';

const router = createRouter({
  history: createWebHistory(),
  routes,
  resolver,
});

const App = () => {
  return (
    <div>
      <header>
        <nav style="display: flex; gap: 10px; padding: 10px; background: #eef;">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/about">About</RouterLink>
          <RouterLink to="/users/456">User 456</RouterLink>
          <RouterLink to="/post/typed">Typed Post</RouterLink>
          <RouterLink to="/nested/child">Nested</RouterLink>
          <RouterLink to="/missing">Catch All</RouterLink>
        </nav>
      </header>
      <main style="padding: 20px;">
        <RouterView router={router} />
      </main>
    </div>
  );
};
createApp(App, '#app');
