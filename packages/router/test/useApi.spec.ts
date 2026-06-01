import { createComponent as _h$, template as _template$, child, insert, next } from 'essor';
import { RouterView, createRouter, usePreloadRoute, useRoute, useRouter } from '../src';
import { components, mount, sleep } from './utils';

let router;
let wrapper;
export function Home() {
  const _$tmpl = _template$('<div>Query: </div>');
  const route = useRoute();

  return (() => {
    const _$el = _$tmpl();
    const _n$ = child(_$el);
    const _n$2 = next(_n$, 1);
    insert(_$el, () => route.query.q, _n$2);
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

  it('should reactive route matched', async () => {
    let routeRef: any;
    const Child = () => {
      const _$tmpl = _template$('<div>Child</div>');
      return _$tmpl();
    };

    const Parent = () => {
      routeRef = useRoute();
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
    await sleep(0);
    expect(currentRoute.value.matched.length).toBe(2);
    expect(currentRoute.value.matched.map((m) => m.path)).toEqual(['/parent', '/parent/child']);

    await router.push('/parent/other');
    await sleep(0);

    expect(currentRoute.value.matched.length).toBe(2);
    expect(currentRoute.value.matched.map((m) => m.path)).toEqual(['/parent', '/parent/other']);
    // routeRef is the reactive proxy — reads always forward to currentRoute.value
    expect(routeRef.path).toBe('/parent/other');
    expect(routeRef.matched.at(-1).path).toBe('/parent/other');
  });

  it('exposes usePreloadRoute for manual route preloading', async () => {
    const loader = vitest.fn();
    router.addRoute({
      path: '/manual-preload',
      loader,
      component: components.Foo,
    });

    let preloadRoute;
    const PreloadProbe = () => {
      preloadRoute = usePreloadRoute();
      const _$tmpl = _template$('<div>Probe</div>');
      return _$tmpl();
    };

    router.addRoute({
      path: '/probe',
      component: PreloadProbe,
    });

    await router.push('/probe');
    await preloadRoute('/manual-preload?x=1');
    expect(loader).toHaveBeenCalledTimes(1);
    expect(loader).toHaveBeenCalledWith(expect.objectContaining({ search: { x: '1' } }));
  });

  it('clears route params when navigating to a route without those params', async () => {
    let paramsText = '';
    const ParamsProbe = () => {
      const route = useRoute();
      paramsText = String(route.params.any ?? 'none');
    };

    router.addRoute({
      path: '/probe-params',
      component: ParamsProbe,
    });

    await router.push('/xx');
    await router.push('/probe-params');

    expect(paramsText).toBe('none');
  });
});

describe('active router fallback stack', () => {
  function makeRouter() {
    return createRouter({
      history: 'memory',
      routes: [{ path: '/:any(.*)', component: components.Home }],
    });
  }

  it('keeps the previous router as fallback when a second router is created', () => {
    const routerA = makeRouter();
    let resolvedA: any;
    const ProbeA = () => {
      resolvedA = useRouter();
      return _template$('<div>A</div>')();
    };
    routerA.addRoute({ path: '/probe-a', component: ProbeA });

    // Creating a second router must NOT clobber routerA's global fallback.
    const routerB = makeRouter();

    // The most recently created router becomes the active fallback.
    let resolvedFallback: any;
    const ProbeFallback = () => {
      resolvedFallback = useRouter();
    };
    mount(() => _h$(ProbeFallback, {}));
    expect(resolvedFallback).toBe(routerB);

    // Destroying B should restore A as the fallback, not clear it.
    routerB.destroy();
    let afterDestroy: any;
    const ProbeAfter = () => {
      afterDestroy = useRouter();
    };
    mount(() => _h$(ProbeAfter, {}));
    expect(afterDestroy).toBe(routerA);
    void resolvedA;
  });
});
