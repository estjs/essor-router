import { RouterView, createRouter, useRoute, useRouter } from 'essor-router';
import {
  child as _child$,
  insert as _insert$,
  next as _next$,
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
    const _n$ = _child$(_$el);
    const _n$2 = _next$(_n$, 1);
    _insert$(_$el, () => route.query.q, _n$2);
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
