import { describe, expect, it } from 'vitest';
import { createMemoryHistory } from '../src/history/memory';
import { createRouter } from '../src/core/router';

describe('router.clearRoutes', () => {
  it('removes all registered routes', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: () => null },
        { path: '/about', name: 'about', component: () => null },
      ],
    });

    expect(router.hasRoute('home')).toBe(true);
    expect(router.hasRoute('about')).toBe(true);

    router.clearRoutes();

    expect(router.hasRoute('home')).toBe(false);
    expect(router.hasRoute('about')).toBe(false);
    expect(router.getRoutes()).toHaveLength(0);
  });
});
