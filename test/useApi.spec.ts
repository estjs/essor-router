import { h as _h$, template as _template$ } from 'essor';
import { RouterView, createRouter, useRoute, useRouter } from '../src';
import { mount } from './utils';

let router;
let wrapper;
const _tmpl$ = _template$('<div>Query: ');
function Home() {
  const route = useRoute();
  router = useRouter();
  return _h$(_tmpl$, {
    '1': {
      children: [[() => route.query.q, null]],
    },
  });
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

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const App = () => {
  return _h$(RouterView, {});
};
describe('use apis', () => {
  beforeEach(async () => {
    wrapper = mount(App);
    // router is async, need to wait
    await sleep(100);
  });

  afterEach(() => {
    wrapper = null;
  });

  it('unwraps useRoute()', async () => {
    expect(wrapper.text()).toBe('Query: ');
    await router.push('/xx/?q=hi');
    expect(wrapper.text()).toBe('Query: hi');
  });
});
