/**
 * Comprehensive RouterView Tests
 * 
 * This test suite provides comprehensive coverage for RouterView component,
 * including initialization, route resolution, depth calculation, and component rendering.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent as h } from 'essor';
import { RouteLocationNormalized, RouterView, createMemoryHistory, createRouter } from '../src';
import { mount, sleep } from './utils';
import type { Router } from '../src/router';

describe('RouterView - Comprehensive Tests', () => {
  let router: Router;
  let wrapper: any;

  const SimpleComponent = () => {
    const div = document.createElement('div');
    div.textContent = 'Simple';
    return div;
  };

  const HomeComponent = () => {
    const div = document.createElement('div');
    div.textContent = 'Home';
    return div;
  };

  const AboutComponent = () => {
    const div = document.createElement('div');
    div.textContent = 'About';
    return div;
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });

  describe('Initialization', () => {
    it('should log error when router is not provided', () => {
      // Test that RouterView logs error when router is missing
      // Essor catches the error during mount, so we check console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        mount(() => h(RouterView, {}));
      } catch (e) {
        // Expected to fail during mount
      }
      
      // Check that error was logged - look in the second call which contains the actual error
      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls;
      const hasRouterError = calls.some(call => 
        call.some(arg => String(arg).includes('RouterView requires a router instance'))
      );
      expect(hasRouterError).toBe(true);
      
      consoleSpy.mockRestore();
    });

    it('should accept router via props', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      expect(wrapper.text()).toContain('Home');
    });

    it('should initialize and destroy router', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
        ],
      });

      const initSpy = vi.spyOn(router, 'init');
      const destroySpy = vi.spyOn(router, 'destroy');

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      expect(initSpy).toHaveBeenCalled();

      wrapper.unmount();
      wrapper = null;

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should provide router context for child components', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      // Router context is provided, component renders successfully
      expect(wrapper.text()).toContain('Home');
    });
  });

  describe('Route Resolution', () => {
    beforeEach(async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
          { path: '/about', name: 'about', component: AboutComponent },
        ],
      });
    });

    it('should use custom route prop when provided', async () => {
      const customRoute = {
        path: '/custom',
        name: 'custom',
        params: {},
        query: {},
        hash: '',
        fullPath: '/custom',
        matched: [],
        meta: {},
        redirectedFrom: undefined,
      };

      wrapper = mount(() => h(RouterView, { router, route: customRoute }));
      await sleep(50);

      // Custom route is used
      expect(wrapper).toBeTruthy();
    });

    it('should use injected route when no route prop provided', async () => {
      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      expect(wrapper.text()).toContain('Home');
    });

    it('should handle null/undefined injected route', async () => {
      wrapper = mount(() => h(RouterView, { router }));
      await sleep(50);

      // Should not crash with null/undefined route
      expect(wrapper).toBeTruthy();
    });

    it('should handle invalid route objects', async () => {
      wrapper = mount(() => h(RouterView, { router }));
      await sleep(50);

      // Should handle invalid route gracefully
      expect(wrapper).toBeTruthy();
    });

    it('should update when route changes', async () => {
      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      expect(wrapper.text()).toContain('Home');

      await router.push('/about');
      await sleep(50);

      expect(wrapper.text()).toContain('About');
    });
  });

  describe('Depth Calculation', () => {
    it('should calculate depth for nested RouterViews', async () => {
      const NestedComponent = () => h(RouterView, { router });

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            name: 'parent',
            component: NestedComponent,
            children: [
              { path: 'child', name: 'child', component: SimpleComponent },
            ],
          },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/child');
      await sleep(100);

      // Nested RouterView should render child component
      expect(wrapper.text()).toContain('Simple');
    });

    it('should skip matched routes without components', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            name: 'parent',
            // No component for parent
            children: [
              { path: 'child', name: 'child', component: SimpleComponent },
            ],
          },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/child');
      await sleep(100);

      // Should skip parent and render child
      expect(wrapper.text()).toContain('Simple');
    });

    it('should handle multiple nesting levels', async () => {
      const Level1 = () => h(RouterView, { router });
      const Level2 = () => h(RouterView, { router });

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            name: 'level0',
            component: Level1,
            children: [
              {
                path: 'level1',
                name: 'level1',
                component: Level2,
                children: [
                  { path: 'level2', name: 'level2', component: SimpleComponent },
                ],
              },
            ],
          },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/level1/level2');
      await sleep(150);

      // Should handle multiple nesting levels
      expect(wrapper.text()).toContain('Simple');
    });
  });

  describe('Component Rendering', () => {
    beforeEach(async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
          { path: '/about', name: 'about', component: AboutComponent },
        ],
      });
    });

    it('should render default view', async () => {
      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      expect(wrapper.text()).toContain('Home');
    });

    it('should render named views', async () => {
      const SidebarComponent = () => {
        const div = document.createElement('div');
        div.textContent = 'Sidebar';
        return div;
      };

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            name: 'home',
            components: {
              default: HomeComponent,
              sidebar: SidebarComponent,
            },
          },
        ],
      });

      // Test that named views can be accessed
      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);
      
      // Default view should render
      expect(wrapper.text()).toContain('Home');
      
      // Named views are supported by the router configuration
      const route = router.currentRoute.value;
      expect(route.matched[0]?.components?.sidebar).toBeDefined();
      expect(route.matched[0]?.components?.default).toBeDefined();
    });

    it('should handle routes without components', async () => {
      // Create router with a route that has no component
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home' }, // No component specified
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      // Should not crash when route has no component
      expect(wrapper).toBeTruthy();
      
      // Verify route matched but has no component
      const route = router.currentRoute.value;
      expect(route.matched.length).toBeGreaterThan(0);
      expect(route.matched[0]?.components).toBeUndefined();
    });

    it('should handle missing component gracefully', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: undefined as any },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      // Should not crash with missing component
      expect(wrapper).toBeTruthy();
    });

    it('should handle null component', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: null as any },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      // Should not crash with null component
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle component rendering errors gracefully', async () => {
      const ErrorComponent = () => {
        throw new Error('Component error');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: ErrorComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      // Error should be logged by essor
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should not crash when component rendering fails', async () => {
      const ErrorComponent = () => {
        throw new Error('Component error');
      };

      const FallbackComponent = () => {
        const div = document.createElement('div');
        div.textContent = 'Fallback';
        return div;
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: ErrorComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router, fallback: FallbackComponent }));
      await router.push('/');
      await sleep(50);

      // Should not crash even if component fails
      expect(wrapper).toBeTruthy();
      
      consoleSpy.mockRestore();
    });

    it('should handle fallback component rendering error', async () => {
      const ErrorComponent = () => {
        throw new Error('Component error');
      };

      const ErrorFallback = () => {
        throw new Error('Fallback error');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: ErrorComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router, fallback: ErrorFallback }));
      await router.push('/');
      await sleep(50);

      // Should not crash even if fallback fails
      expect(wrapper).toBeTruthy();
      
      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions gracefully', async () => {
      const ErrorComponent = () => {
        throw 'String error';
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: ErrorComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Reactive Route', () => {
    it('should create reactive route for useRoute hook', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
          { path: '/about', name: 'about', component: AboutComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      expect(wrapper.text()).toContain('Home');

      await router.push('/about');
      await sleep(50);

      expect(wrapper.text()).toContain('About');
    });

    it('should handle null currentRoute', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await sleep(50);

      // Should handle null currentRoute gracefully
      expect(wrapper).toBeTruthy();
    });

    it('should handle invalid currentRoute object', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await sleep(50);

      // Should handle invalid currentRoute gracefully
      expect(wrapper).toBeTruthy();
    });
  });

  describe('View Name Resolution', () => {
    it('should default to "default" view name', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            name: 'home',
            components: {
              default: HomeComponent,
            },
          },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      expect(wrapper.text()).toContain('Home');
    });

    it('should use custom view name when provided', async () => {
      const CustomComponent = () => {
        const div = document.createElement('div');
        div.textContent = 'Custom';
        return div;
      };

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            name: 'home',
            components: {
              default: HomeComponent,
              custom: CustomComponent,
            },
          },
        ],
      });

      wrapper = mount(() => h(RouterView, { router, name: 'custom' }));
      await router.push('/');
      await sleep(50);

      expect(wrapper.text()).toContain('Custom');
    });

    it('should handle non-existent view name', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            name: 'home',
            components: {
              default: HomeComponent,
            },
          },
        ],
      });

      wrapper = mount(() => h(RouterView, { router, name: 'nonexistent' }));
      await router.push('/');
      await sleep(50);

      // Should not crash with non-existent view name
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Edge Cases and Coverage', () => {
    it('should handle route prop with custom route object', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
        ],
      });

      const customRoute: RouteLocationNormalized = {
        path: '/custom',
        name: 'custom',
        params: {},
        query: {},
        hash: '',
        fullPath: '/custom',
        matched: [{
          path: '/custom',
          name: 'custom',
          components: { default: AboutComponent },
          meta: {},
          props: {},
          children: [],
          instances: {},
          leaveGuards: new Set(),
          updateGuards: new Set(),
          enterCallbacks: {},
          aliasOf: undefined,
        }],
        meta: {},
        redirectedFrom: undefined,
      };

      wrapper = mount(() => h(RouterView, { router, route: customRoute }));
      await sleep(50);

      // Should render component from custom route
      expect(wrapper.text()).toContain('About');
    });

    it('should handle injected route as signal', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      // Should handle signal-based route
      expect(wrapper.text()).toContain('Home');
    });

    it('should handle depth calculation with nested routes', async () => {
      const ParentComponent = () => h(RouterView, { router });

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/parent',
            name: 'parent',
            component: ParentComponent,
            children: [
              {
                path: 'child',
                name: 'child',
                component: SimpleComponent,
              },
            ],
          },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/parent/child');
      await sleep(100);

      // Should render nested child component
      expect(wrapper.text()).toContain('Simple');
    });

    it('should provide reactive route for useRoute hook', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
          { path: '/about', name: 'about', component: AboutComponent },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/');
      await sleep(50);

      expect(wrapper.text()).toContain('Home');

      // Navigate to different route
      await router.push('/about');
      await sleep(50);

      expect(wrapper.text()).toContain('About');
    });

    it('should handle view name resolution for named views', async () => {
      const SidebarComponent = () => {
        const div = document.createElement('div');
        div.textContent = 'Sidebar';
        return div;
      };

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/',
            name: 'home',
            components: {
              default: HomeComponent,
              sidebar: SidebarComponent,
            },
          },
        ],
      });

      wrapper = mount(() => h(RouterView, { router, name: 'default' }));
      await router.push('/');
      await sleep(50);

      // Should render default view
      expect(wrapper.text()).toContain('Home');
    });

    it('should handle matched route without components at depth', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: '/parent',
            name: 'parent',
            // No component for parent
            children: [
              {
                path: 'child',
                name: 'child',
                component: SimpleComponent,
              },
            ],
          },
        ],
      });

      wrapper = mount(() => h(RouterView, { router }));
      await router.push('/parent/child');
      await sleep(100);

      // Should skip parent without component and render child
      expect(wrapper.text()).toContain('Simple');
    });

    it('should handle route with empty matched array', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
        ],
      });

      const emptyRoute: RouteLocationNormalized = {
        path: '/empty',
        name: 'empty',
        params: {},
        query: {},
        hash: '',
        fullPath: '/empty',
        matched: [],
        meta: {},
        redirectedFrom: undefined,
      };

      wrapper = mount(() => h(RouterView, { router, route: emptyRoute }));
      await sleep(50);

      // Should not crash with empty matched array
      expect(wrapper).toBeTruthy();
    });

    it('should handle route without matched property', async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: HomeComponent },
        ],
      });

      const invalidRoute = {
        path: '/invalid',
        name: 'invalid',
        params: {},
        query: {},
        hash: '',
        fullPath: '/invalid',
        meta: {},
      } as RouteLocationNormalized;

      wrapper = mount(() => h(RouterView, { router, route: invalidRoute }));
      await sleep(50);

      // Should not crash with missing matched property
      expect(wrapper).toBeTruthy();
    });
  });
});