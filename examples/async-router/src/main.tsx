import { RouterView, createRouter } from 'essor-router';

createRouter({
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
  return <RouterView></RouterView>;
};

(<App />).mount(document.querySelector('#app')!);
