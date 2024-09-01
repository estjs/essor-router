import { RouterView, createRouter, useRoute, useRouter } from 'essor-router';
let router;
function Home() {
  const route = useRoute();
  router = useRouter();
  return <div>route.query: {route.query.q}</div>;
}

createRouter({
  history: 'memory',
  routes: [
    {
      path: '/:any(.*)',
      component: Home,
    },
  ],
});
const App = () => {
  return <RouterView></RouterView>;
};

setTimeout(() => {
  router.push('/xx/?q=hi');
}, 10000);

(<App />).mount(document.querySelector('#app')!);
