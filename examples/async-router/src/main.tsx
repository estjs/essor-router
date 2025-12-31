import { RouterView, createRouter } from 'essor-router';
import { createApp } from 'essor/*';

const router = createRouter({
  history: 'hash',
  routes: [
    {
      path: '/',
      component: import('./Home'),
    },
    {
      path: '/about',
      component: import('./About'),
    },
    {
      path: '/:pathMatch(.*)*',
      component: import('./NotFound'),
    },
  ],
});

const App = () => {
  return <RouterView router={router}></RouterView>;
};

createApp(App, '#app');
