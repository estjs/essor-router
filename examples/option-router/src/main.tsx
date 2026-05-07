import { RouterView, createRouter } from 'essor-router';
import { createApp } from 'essor';
import About from './About';
import notFound from './NotFound';
import Random from './Random';
import Layout from './Layout';
import Home from './Home';

const router = createRouter({
  history: 'history',
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/home',
      children: [
        {
          path: 'home',
          component: Home,
        },
        {
          path: 'about',
          component: About,
        },
        {
          path: 'random',
          component: Random,
        },
        {
          path: ':pathMatch(.*)*',
          component: notFound,
        },
      ],
    },
  ],
});

const App = () => {
  return <RouterView router={router}></RouterView>;
};

createApp(App, '#app');
