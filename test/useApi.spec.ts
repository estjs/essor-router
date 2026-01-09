import { createComponent as _h$, template as _template$, computed, insert, mapNodes } from 'essor';
import { RouterView, createRouter, useRoute } from '../src';
import { components, mount, sleep } from './utils';

let router;
let wrapper;
export function Home() {
  const _$tmpl = _template$('<div>Query: </div>');
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
        {
          path: '/api',
          component: components.Foo,
        },
      ],
    });
    const App = () => {
      return _h$(RouterView, { router });
    };
    wrapper = mount(App);
    // router is async, need to wait
    await sleep(200);
    // Ensure router has navigated to initial route
    await router.push('/');
    await sleep(50);
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

  it('it should reactive route matched', async () => {
    let compt;
    const Child = () => {
      const _$tmpl = _template$('<div>Child</div>');
      return _$tmpl();
    };

    const Parent = () => {
      const route = useRoute();
      compt = computed(() => {
        const matched = route.matched?.at(-1);
        return matched;
      });
    };

    const OtherChild = () => {
      const _$tmpl = _template$('<div>OtherChild</div>');
      return _$tmpl();
    };

    router.addRoute({
      path: '/parent',
      component: Parent,
      children: [
        {
          path: 'child',
          component: Child,
        },
        {
          path: 'other',
          component: OtherChild,
        },
      ],
    });

    const currentRoute = router.currentRoute;

    await router.push('/parent/child');
    expect(compt.value.path).toBe('/parent/child');
    expect(currentRoute.value.matched.length).toBe(2);
    expect(currentRoute.value.matched.map(m => m.path)).toEqual(['/parent', '/parent/child']);

    await router.push('/parent/other');
    expect(compt.value.path).toBe('/parent/other');
    expect(currentRoute.value.matched.length).toBe(2);
    expect(currentRoute.value.matched.map(m => m.path)).toEqual(['/parent', '/parent/other']);
  });
});
