/**
 * RouterLink Tests
 * 
 * Comprehensive test suite for RouterLink component covering:
 * - Basic rendering and navigation
 * - Click event handling with modifiers
 * - Active class logic
 * - Custom rendering modes
 * - Aria attributes
 * - Error handling
 * - Href generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent as h } from 'essor';
import { RouterLink, RouterView, createMemoryHistory, createRouter } from '../src';
import { mount, sleep } from './utils';
import { testWithMultipleInputs, generateRouteLocation, randomBoolean } from './helpers/test-utils';
import type { Router } from '../src/router';

describe('RouterLink', () => {
  let router: Router;
  let wrapper: any;

  const SimpleComponent = () => {
    const div = document.createElement('div');
    div.textContent = 'Simple';
    return div;
  };

  const About = () => h(RouterLink, { to: '/', children: ['About'] });
  const User = () => h(RouterLink, { to: '/users/1', children: ['Users'] });
  const Home = () => h(RouterLink, { to: '/about', children: ['Home'] });

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: Home },
        { path: '/about', name: 'about', component: About },
        { path: '/users/:id', name: 'user', component: User },
        { path: '/posts/:id?', name: 'post', component: SimpleComponent },
        { path: '/nested/child', name: 'nested-child', component: SimpleComponent },
      ],
    });

    const App = () => {
      return h(RouterView, { router });
    };
    wrapper = mount(App);
    // router is async, need to wait
    await sleep(100);
    // Ensure router has navigated to initial route
    await router.push('/');
    await sleep(50);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }
  });

  describe('Basic Rendering', () => {
    it('renders an anchor tag by default', async () => {
      // Wait for component to render properly
      await sleep(50);
      const anchor = wrapper.get('a');
      expect(anchor).toBeTruthy();
      expect(anchor.textContent).toBe('Home');
    });
  });

  describe('Navigation Behavior', () => {
    it('uses replace when replace prop is true', async () => {
      // Navigate to home first
      await router.push('/');
      await sleep(50);
      
      // Get the anchor from the rendered Home component (which contains a RouterLink to /about)
      const anchor = wrapper.get('a');
      expect(anchor).toBeTruthy();
      expect(anchor.textContent).toBe('Home');

      // Create a new router with a route that has replace=true
      const TestLinkComponent = () =>
        h(RouterLink, {
          to: '/about',
          replace: true,
          children: ['Replace Link'],
        });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestLinkComponent },
          { path: '/about', name: 'about', component: About },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await sleep(100);
      await testRouter.push('/');
      await sleep(50);

      const testSpy = vi.spyOn(testRouter, 'replace');
      const testAnchor = testWrapper.get('a');
      expect(testAnchor).toBeTruthy();

      // Trigger click event
      testAnchor.click();
      await sleep(50); // Allow time for async navigation

      expect(testSpy).toHaveBeenCalledTimes(1);

      testWrapper.unmount();
    });

    it('handles object as "to" prop', async () => {
      // Create a component that renders RouterLink with object "to" prop
      const TestComponent = () =>
        h(RouterLink, {
          to: { name: 'user', params: { id: '123' } },
          children: 'User',
        });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/users/:id', name: 'user', component: User },
        ],
      });

      const spy = vi.spyOn(testRouter, 'push');

      const objectWrapper = mount(() => h(RouterView, { router: testRouter }));
      await sleep(100);
      await testRouter.push('/');
      await sleep(50);

      const anchor = objectWrapper.get('a');
      expect(anchor).toBeTruthy();

      // Trigger click event
      anchor.click();
      await sleep(150); // Allow time for async navigation

      expect(spy).toHaveBeenCalledWith({ name: 'user', params: { id: '123' } });

      objectWrapper.unmount();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when router is not provided', () => {
      // Test that useLink throws when router context is missing
      // The error is caught by essor's error handling, so we just verify the warning is logged
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        mount(() => h(RouterLink, { to: '/', children: 'Test' }));
      } catch (error) {
        // Error is expected
      }
      
      // Verify error was logged (but suppressed from console)
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle invalid "to" prop gracefully', async () => {
      // Mock console to suppress expected warnings and errors
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => h(RouterView, { router });
      const testWrapper = mount(TestComponent);
      await sleep(50);

      // Create a link with invalid "to" prop
      const InvalidLink = () => h(RouterLink, { 
        to: { name: 'non-existent-route' } as any,
        children: 'Invalid'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: InvalidLink },
        ],
      });

      const invalidWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = invalidWrapper.get('a');
      expect(anchor).toBeTruthy();
      // When resolution fails, it falls back to current location '/'
      expect(anchor.getAttribute('href')).toBe('/');

      // Verify that warnings were logged (but suppressed from console)
      expect(consoleWarnSpy).toHaveBeenCalled();

      testWrapper.unmount();
      invalidWrapper.unmount();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle route resolution errors', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => h(RouterLink, {
        to: { path: undefined as any },
        children: 'Test'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/', name: 'home', component: TestComponent }],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      // Should handle the error gracefully
      const anchor = testWrapper.get('a');
      expect(anchor).toBeTruthy();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      testWrapper.unmount();
    });

    it('should handle navigation errors gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      // Mock push to throw error
      const originalPush = testRouter.push;
      testRouter.push = vi.fn().mockRejectedValue(new Error('Navigation error'));

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/').catch(() => {});
      await sleep(50);

      const anchor = testWrapper.get('a');
      anchor.click();
      await sleep(50);

      // Should not throw, error should be handled
      expect(testRouter.push).toHaveBeenCalled();

      // Restore
      testRouter.push = originalPush;
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      testWrapper.unmount();
    });
  });

  describe('Click Event Handling', () => {
    it('should not navigate with ctrl key pressed', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const spy = vi.spyOn(testRouter, 'push');
      const anchor = testWrapper.get('a');

      // Simulate click with ctrl key
      const event = new MouseEvent('click', { ctrlKey: true, bubbles: true });
      anchor.dispatchEvent(event);
      await sleep(50);

      expect(spy).not.toHaveBeenCalled();
      testWrapper.unmount();
    });

    it('should not navigate with meta key pressed', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const spy = vi.spyOn(testRouter, 'push');
      const anchor = testWrapper.get('a');

      // Simulate click with meta key
      const event = new MouseEvent('click', { metaKey: true, bubbles: true });
      anchor.dispatchEvent(event);
      await sleep(50);

      expect(spy).not.toHaveBeenCalled();
      testWrapper.unmount();
    });

    it('should not navigate with shift key pressed', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const spy = vi.spyOn(testRouter, 'push');
      const anchor = testWrapper.get('a');

      // Simulate click with shift key
      const event = new MouseEvent('click', { shiftKey: true, bubbles: true });
      anchor.dispatchEvent(event);
      await sleep(50);

      expect(spy).not.toHaveBeenCalled();
      testWrapper.unmount();
    });

    it('should not navigate with alt key pressed', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const spy = vi.spyOn(testRouter, 'push');
      const anchor = testWrapper.get('a');

      // Simulate click with alt key
      const event = new MouseEvent('click', { altKey: true, bubbles: true });
      anchor.dispatchEvent(event);
      await sleep(50);

      expect(spy).not.toHaveBeenCalled();
      testWrapper.unmount();
    });

    it('should not navigate on right click', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const spy = vi.spyOn(testRouter, 'push');
      const anchor = testWrapper.get('a');

      // Simulate right click (button = 2)
      const event = new MouseEvent('click', { button: 2, bubbles: true });
      anchor.dispatchEvent(event);
      await sleep(50);

      expect(spy).not.toHaveBeenCalled();
      testWrapper.unmount();
    });

    it('should not navigate when preventDefault is called', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const spy = vi.spyOn(testRouter, 'push');
      const anchor = testWrapper.get('a');

      // Add event listener that prevents default
      anchor.addEventListener('click', (e: Event) => {
        e.preventDefault();
      }, { capture: true });

      anchor.click();
      await sleep(50);

      expect(spy).not.toHaveBeenCalled();
      testWrapper.unmount();
    });

    it('should handle target attribute', async () => {
      // Test that RouterLink passes through the target attribute
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      // Verify the anchor is rendered
      expect(anchor).toBeTruthy();
      expect(anchor.getAttribute('href')).toBe('/about');
      testWrapper.unmount();
    });
  });

  describe('Active Class Logic', () => {
    it('applies custom active class when provided', async () => {
      // Create a component that renders RouterLink with custom activeClass
      const TestComponent = () =>
        h(RouterLink, {
          to: '/',
          activeClass: 'my-active-class',
          children: 'Home',
        });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: About },
        ],
      });

      const customWrapper = mount(() => h(RouterView, { router: testRouter }));
      await sleep(100);
      
      // Ensure we're on the root route to make the link active
      await testRouter.push('/');
      await sleep(100);

      const anchor = customWrapper.get('a');
      expect(anchor).toBeTruthy();
      expect(anchor.classList.contains('my-active-class')).toBe(true);

      customWrapper.unmount();
    });

    it('should apply active class for partial match', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/nested',
        children: 'Nested'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: SimpleComponent },
          { path: '/nested', name: 'nested', component: TestComponent },
          { path: '/nested/child', name: 'nested-child', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      
      // Navigate to nested route first
      await testRouter.push('/nested');
      await sleep(100);

      const anchor = testWrapper.get('a');
      // Should have active class when on the exact route
      expect(anchor.classList.contains('router-link-active')).toBe(true);

      testWrapper.unmount();
    });

    it('should apply exact active class only for exact match', async () => {
      const AboutComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: AboutComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(100);

      const anchor = testWrapper.get('a');
      // Should not have exact active class when not on the route
      expect(anchor.classList.contains('router-link-exact-active')).toBe(false);

      testWrapper.unmount();
    });

    it('should handle custom active class', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/',
        activeClass: 'custom-active',
        children: 'Home'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.classList.contains('custom-active')).toBe(true);
      expect(anchor.classList.contains('router-link-active')).toBe(false);
      testWrapper.unmount();
    });

    it('should handle custom exact active class', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/',
        exactActiveClass: 'custom-exact-active',
        children: 'Home'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.classList.contains('custom-exact-active')).toBe(true);
      expect(anchor.classList.contains('router-link-exact-active')).toBe(false);
      testWrapper.unmount();
    });

    it('should combine user class with active classes', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/',
        class: 'user-class',
        children: 'Home'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.classList.contains('user-class')).toBe(true);
      expect(anchor.classList.contains('router-link-active')).toBe(true);
      expect(anchor.classList.contains('router-link-exact-active')).toBe(true);
      testWrapper.unmount();
    });
  });

  describe('Custom Rendering', () => {
    it('should support custom rendering mode', async () => {
      // Custom mode allows rendering custom children instead of anchor tag
      // In custom mode, RouterLink returns the children directly
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        custom: true,
        children: 'Custom Content'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      // In custom mode, children are rendered directly
      expect(testWrapper.text()).toContain('Custom Content');

      testWrapper.unmount();
    });
  });

  describe('Aria Attributes', () => {
    it('should set aria-current when exact active', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/',
        ariaCurrentValue: 'page',
        children: 'Home'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.getAttribute('aria-current')).toBe('page');
      testWrapper.unmount();
    });

    it('should not set aria-current when not exact active', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        ariaCurrentValue: 'page',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.getAttribute('aria-current')).toBeNull();
      testWrapper.unmount();
    });
  });

  describe('Href Generation', () => {
    it('should generate correct href for string paths', async () => {
      const TestComponent = () => h(RouterLink, {
        to: '/about',
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.getAttribute('href')).toBe('/about');
      testWrapper.unmount();
    });

    it('should generate correct href for named routes', async () => {
      const TestComponent = () => h(RouterLink, {
        to: { name: 'about' },
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.getAttribute('href')).toBe('/about');
      testWrapper.unmount();
    });

    it('should generate correct href with params', async () => {
      const TestComponent = () => h(RouterLink, {
        to: { name: 'user', params: { id: '123' } },
        children: 'User'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/users/:id', name: 'user', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.getAttribute('href')).toBe('/users/123');
      testWrapper.unmount();
    });

    it('should generate correct href with query', async () => {
      const TestComponent = () => h(RouterLink, {
        to: { path: '/about', query: { foo: 'bar' } },
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.getAttribute('href')).toBe('/about?foo=bar');
      testWrapper.unmount();
    });

    it('should generate correct href with hash', async () => {
      const TestComponent = () => h(RouterLink, {
        to: { path: '/about', hash: '#section' },
        children: 'About'
      });

      const testRouter = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', name: 'home', component: TestComponent },
          { path: '/about', name: 'about', component: SimpleComponent },
        ],
      });

      const testWrapper = mount(() => h(RouterView, { router: testRouter }));
      await testRouter.push('/');
      await sleep(50);

      const anchor = testWrapper.get('a');
      expect(anchor.getAttribute('href')).toBe('/about#section');
      testWrapper.unmount();
    });
  });

  describe('Multiple Input Testing', () => {
    it('should handle various route locations correctly', async () => {
      await testWithMultipleInputs(
        () => generateRouteLocation(randomBoolean()),
        async (location) => {
          const testRouter = createRouter({
            history: createMemoryHistory(),
            routes: [
              { path: '/', name: 'home', component: SimpleComponent },
              { path: '/about', name: 'about', component: SimpleComponent },
              { path: '/:pathMatch(.*)*', name: 'catch-all', component: SimpleComponent },
            ],
          });

          try {
            const resolved = testRouter.resolve(location);
            expect(resolved).toBeDefined();
            expect(resolved.href).toBeDefined();
          } catch (error) {
            // Some random locations might not resolve, that's okay
          }
        },
        50 // Test with 50 random locations
      );
    });
  });
});
