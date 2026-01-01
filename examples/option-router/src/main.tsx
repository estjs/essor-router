import { RouterView, createRouter } from 'essor-router';
import { createApp } from 'essor';
import Home from './Home';
import About from './About';
import notFound from './NotFound';

const router = createRouter({
  history: 'history',
  routes: [
    {
      path: '/',
      component: Home,
    },
    {
      path: '/about',
      component: About,
    },
    {
      path: '/:pathMatch(.*)*',
      component: notFound,
    },
  ],
});

const App = () => {
  return <RouterView router={router}></RouterView>;
};

createApp(App, '#app');
