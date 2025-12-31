import { type RouterHistory, createMemoryHistory, createRouter } from '../src';
import { components, createDom } from './utils';

const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t));

function newRouter(options: Partial<Parameters<typeof createRouter>[0]> = {}) {
  const history = (options.history || createMemoryHistory('/')) as RouterHistory;
  const router = createRouter({
    history,
    routes: [
      {
        path: '/:pathMatch(.*)',
        component: components.Foo,
      },
    ],
    ...options,
  });

  return { history, router };
}

describe('multiple apps', () => {
  beforeEach(() => {
    createDom();
    const rootEl = document.createElement('div');
    rootEl.id = 'app';
    document.body.append(rootEl);
  });

  it('does not listen to url changes before being ready', async () => {
    const { router, history } = newRouter();

    const spy = vitest.fn((to, from, next) => {
      next();
    });
    router.beforeEach(spy);

    history.push('/foo');
    history.push('/bar');
    history.go(-1, true);

    await delay(5);
    expect(spy).not.toHaveBeenCalled();

    await router.push('/baz');

    history.go(-1, true);
    await delay(5);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
