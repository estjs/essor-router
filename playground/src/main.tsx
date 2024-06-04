import { RouterLink, RouterView, createRouter } from 'essor-router';
import { onMount } from 'essor';

function T1() {
  return <div>t1</div>;
}

function t2() {
  return (
    <div>
      123
      <RouterLink to="/">Go to About</RouterLink>
    </div>
  );
}
function notFound() {
  return <div>404</div>;
}
const router = createRouter({
  history: 'hash',
  routes: [
    {
      path: '/',
      component: T1,
    },
    {
      path: '/about',
      component: t2,
    },
    {
      path: '/:pathMatch(.*)*',
      component: notFound,
    },
  ],
});

const App = () => {
  setTimeout(() => {
    router.push('/about');
  }, 2000);

  return <RouterView></RouterView>;
};
(<App />).mount(document.querySelector('#app')!);
