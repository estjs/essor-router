import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from '../../src';

describe('createRouter integration', () => {
  it('collects prerender paths and render mode', () => {
    const Home = () => null;
    const User = () => null;

    const router = createRouter({
      history: createMemoryHistory('/'),
      routes: [
        { name: 'home', path: '/', component: Home },
        {
          name: 'users-id',
          path: '/users/:id',
          component: User,
          start: {
            prerender: true,
            preload: 'intent',
            prerenderPaths: ['/users/1', '/users/2'],
          },
          meta: { section: 'users' },
        },
      ],
    });

    const prerender = router.getPrerenderPaths();
    expect(prerender).toHaveLength(1);
    expect(prerender[0]).toEqual({
      name: 'users-id',
      pathTemplate: '/users/:id',
      paths: ['/users/1', '/users/2'],
      meta: { section: 'users' },
    });

    expect(router.getRouteRenderMode('users-id')).toBe('prerender');
    expect(router.getRouteRenderMode('home')).toBe('csr');
  });

  it('resolves typed-like named route inputs', () => {
    const Home = () => null;
    const User = () => null;

    const router = createRouter({
      history: createMemoryHistory('/'),
      routes: [
        { name: 'home', path: '/', component: Home },
        { name: 'users-id', path: '/users/:id', component: User },
      ],
    });

    const resolved = router.resolve({ name: 'users-id', params: { id: '99' } });
    expect(resolved.path).toBe('/users/99');
    expect(resolved.name).toBe('users-id');
  });
});
