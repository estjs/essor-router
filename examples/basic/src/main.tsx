import { RouterLink, RouterView, createRouter } from 'essor-router';
import { createApp } from 'essor';

function Home() {
  return (
    <RouterLink to="/about" class="home">
      Home
    </RouterLink>
  );
}

function About() {
  return (
    <RouterLink to="/" class="about">
      About
    </RouterLink>
  );
}
function notFound() {
  return <div class="notfound">404</div>;
}
const router = createRouter({
  history: 'hash',
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
