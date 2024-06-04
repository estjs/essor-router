import { RouterLink, RouterView, createRouter } from 'essor-router';

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
createRouter({
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
  return <RouterView></RouterView>;
};

(<App />).mount(document.querySelector('#app')!);
