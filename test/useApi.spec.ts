import { createComponent as _h$, template as _template$, insert, mapNodes } from 'essor';
import { RouterView, createRouter, useRoute } from '../src';
import { mount, sleep } from './utils';

let router;
let wrapper;
export function Home() {
  const _$tmpl = _template$('<div>Query:</div>');
  const route = useRoute();

  return (() => {
    const _$el = _$tmpl();
    const _$nodes = mapNodes(_$el, [1]);
    insert(_$nodes[0], () => route.query.q);
    return _$el;
  })();
}

describe('use apis', () => {
  beforeEach(async () => {
    router = createRouter({
      history: 'memory',
      routes: [
        {
          path: '/:any(.*)',
          component: Home,
        },
      ],
    });
    const App = () => {
      return _h$(RouterView, { router });
    };
    wrapper = mount(App);
    // router is async, need to wait
    await sleep(200);
  });

  afterEach(() => {
    wrapper && wrapper.unmount();
    wrapper = null;
  });

  it('unwraps useRoute()', async () => {
    expect(wrapper.text()).toBe('Query: ');
    await router.push('/xx/?q=hi');
    expect(wrapper.text()).toBe('Query: hi');
  });
});
