import { RouterView, createRouter, useRoute, useRouter } from 'essor-router';
import {
  insert as _insert$,
  mapNodes as _mapNodes$,
  template as _template$,
  createApp,
} from 'essor';

const _$tmpl = _template$('<div>route.query:</div>');
function Home() {
  const route = useRoute();
  const router = useRouter();

  // Demo navigation after component mounts
  setTimeout(() => {
    router.push('/xx/?q=hi');
  }, 1000);
  return (() => {
    const _$el = _$tmpl();
    const _$nodes = _mapNodes$(_$el, [1]);
    _insert$(_$nodes[0], () => route.query.q);
    return _$el;
  })();
}
const router = createRouter({
  history: 'memory',
  routes: [
    {
      path: '/:any(.*)',
      component: Home,
    },
  ],
});

const App = () => {
  return <RouterView router={router}></RouterView>;
};

createApp(App, '#app');
